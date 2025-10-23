import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import XLSX from 'xlsx'
import slugify from 'slugify'
import Report from '../models/Report.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// Storage configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext)
    const timestamp = Date.now()
    const slug = slugify(base, { lower: true, strict: true })
    cb(null, `${slug}-${timestamp}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|xlsx|xls|docx|doc/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  }
})

// Helper function to generate unique slugs
const generateUniqueSlug = async (title, existingSlug = null) => {
  if (!title) {
    throw new Error('Title is required for slug generation')
  }

  let baseSlug = existingSlug || slugify(title, { lower: true, strict: true })
  if (!baseSlug) {
    baseSlug = `report-${Date.now()}`
  }

  let slug = baseSlug
  let counter = 0

  while (true) {
    const existing = await Report.findOne({ slug }).lean()
    if (!existing) {
      return slug
    }
    counter++
    slug = `${baseSlug}-${counter}`
  }
}

// Middleware: Authentication required for all routes
router.use(authenticate)
router.use(requireRole('super_admin', 'admin', 'editor'))

// GET /api/reports - List reports with filtering and pagination
router.get('/', async (req, res, next) => {
  try {
    const {
      q = '',
      status,
      category,
      subCategory,
      featured,
      popular,
      from,
      to,
      sort = 'newest',
      limit = 50,
      offset = 0
    } = req.query

    // Build query object
    const query = {}

    if (status) {
      query.status = status
    }

    if (category) {
      query.category = category
    }

    if (subCategory) {
      query.subCategory = subCategory
    }

    if (featured !== undefined) {
      query.featured = featured === 'true'
    }

    if (popular !== undefined) {
      query.popular = popular === 'true'
    }

    // Date range filter
    if (from || to) {
      query.createdAt = {}
      if (from) query.createdAt.$gte = new Date(from)
      if (to) query.createdAt.$lte = new Date(to)
    }

    // Text search
    let findCondition = query
    let projection = undefined

    if (q && q.trim()) {
      findCondition = {
        $and: [
          query,
          { $text: { $search: q.trim() } }
        ]
      }
      projection = { score: { $meta: 'textScore' } }
    }

    // Sorting
    let sortOption = { createdAt: -1 } // default: newest first

    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 }
        break
      case 'title':
        sortOption = { title: 1 }
        break
      case 'status':
        sortOption = { status: 1, createdAt: -1 }
        break
      case 'relevance':
        if (q && q.trim()) {
          sortOption = { score: { $meta: 'textScore' }, createdAt: -1 }
        }
        break
      default:
        sortOption = { createdAt: -1 }
    }

    // Execute query with pagination
    const limitNum = Math.min(parseInt(limit) || 50, 200)
    const offsetNum = parseInt(offset) || 0

    const [items, total] = await Promise.all([
      Report.find(findCondition, projection)
        .sort(sortOption)
        .skip(offsetNum)
        .limit(limitNum)
        .lean(),
      Report.countDocuments(findCondition)
    ])

    res.json({
      items,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    next(error)
  }
})

// POST /api/reports - Create new report
router.post('/', async (req, res, next) => {
  try {
    const {
      title,
      subTitle,
      summary,
      content,
      category,
      subCategory,
      excelDataPackLicense,
      singleUserLicense,
      enterpriseLicensePrice,
      status = 'draft',
      featured = false,
      popular = false,
      ...otherFields
    } = req.body

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Title is required'
      })
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(title)

    // Clean and prepare data
    const reportData = {
      title: title.trim(),
      subTitle: subTitle?.trim() || '',
      slug,
      summary: summary?.trim() || '',
      content: content || '',
      category: category?.trim() || '',
      subCategory: subCategory?.trim() || '',
      excelDataPackLicense: excelDataPackLicense?.trim() || '',
      singleUserLicense: singleUserLicense?.trim() || '',
      enterpriseLicensePrice: enterpriseLicensePrice?.trim() || '',
      status,
      featured: Boolean(featured),
      popular: Boolean(popular),
      tags: [], // Initialize as empty array
      author: req.user?.name || 'System'
    }

    // Add other valid fields
    const allowedFields = [
      'titleTag', 'url', 'metaDescription', 'keywords',
      'metaTitle', 'metaKeywords',
      'ogTitle', 'ogDescription', 'ogImage',
      'twitterTitle', 'twitterDescription', 'twitterImage',
      'language', 'region', 'industry', 'reportType',
      'pages', 'format', 'price', 'currency',
      // Report content fields
      'reportDescription', 'segment', 'companies', 'reportCategories',
      'tableOfContents', 'segmentationContent'
    ]

    allowedFields.forEach(field => {
      if (otherFields[field] !== undefined) {
        reportData[field] = otherFields[field]
      }
    })

    console.log('Creating report with data:', JSON.stringify(reportData, null, 2))

    // Create the report
    const report = await Report.create(reportData)

    console.log('Report created successfully:', report._id)

    res.status(201).json({
      success: true,
      data: report,
      message: 'Report created successfully'
    })
  } catch (error) {
    console.error('Error creating report:', error)

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid data provided',
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      })
    }

    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Duplicate Error',
        message: 'A report with this slug already exists'
      })
    }

    next(error)
  }
})

// GET /api/reports/:id - Get single report
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const report = await Report.findById(id).lean()

    if (!report) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Report not found'
      })
    }

    res.json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('Error fetching report:', error)

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Invalid report ID format'
      })
    }

    next(error)
  }
})

// PATCH /api/reports/:id - Update report
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body }

    // Remove fields that shouldn't be updated directly
    delete updateData._id
    delete updateData.createdAt
    delete updateData.updatedAt
    delete updateData.__v

    // If title is being updated, regenerate slug
    if (updateData.title && updateData.title.trim()) {
      const currentReport = await Report.findById(id).lean()
      if (!currentReport) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Report not found'
        })
      }

      // Only regenerate slug if title actually changed
      if (updateData.title.trim() !== currentReport.title) {
        updateData.slug = await generateUniqueSlug(updateData.title.trim())
      }
    }

    // Update lastUpdated
    updateData.lastUpdated = new Date()

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!updatedReport) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Report not found'
      })
    }

    res.json({
      success: true,
      data: updatedReport,
      message: 'Report updated successfully'
    })
  } catch (error) {
    console.error('Error updating report:', error)

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid data provided',
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      })
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Invalid report ID format'
      })
    }

    next(error)
  }
})

// DELETE /api/reports/:id - Delete report
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const deletedReport = await Report.findByIdAndDelete(id)

    if (!deletedReport) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Report not found'
      })
    }

    res.json({
      success: true,
      message: 'Report deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting report:', error)

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Invalid report ID format'
      })
    }

    next(error)
  }
})

// POST /api/reports/:id/cover - Upload cover image
router.post('/:id/cover', upload.single('file'), async (req, res, next) => {
  try {
    const { id } = req.params

    if (!req.file) {
      return res.status(400).json({
        error: 'No File',
        message: 'No file uploaded'
      })
    }

    const fileUrl = `/uploads/${path.basename(req.file.path)}`
    const altText = req.body.alt || ''

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      {
        coverImage: {
          url: fileUrl,
          alt: altText
        }
      },
      { new: true }
    )

    if (!updatedReport) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Report not found'
      })
    }

    res.json({
      success: true,
      data: updatedReport,
      message: 'Cover image uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading cover image:', error)
    next(error)
  }
})

// POST /api/reports/upload-image - Generic image upload for rich text editors
router.post('/upload-image', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No File',
        message: 'No file uploaded'
      })
    }

    const fileUrl = `/uploads/${path.basename(req.file.path)}`

    res.json({
      success: true,
      url: fileUrl,
      message: 'Image uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    next(error)
  }
})

// GET /api/reports/export - Export reports to Excel/CSV
router.get('/export', async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query
    
    // Get ALL reports from database (no pagination limit)
    const reports = await Report.find({}).lean()
    
    console.log(`Exporting ${reports.length} reports in ${format} format`)
    
    if (format === 'excel') {
      // Create Excel workbook
      const workbook = XLSX.utils.book_new()
      
      // Prepare data for Excel
      const excelData = reports.map(report => ({
        'Report Title': report.title,
        'Title Meta Tag': report.subTitle || '',
        'REPORT OVERVIEW': report.summary || '',
        'Table of Contents': report.tableOfContents || '',
        'Category': report.category || report.domain || report.industry || '',
        'Sub Category': report.subCategory || report.subdomain || report.reportType || '',
        'SEGMENTATION': report.segment || '',
        'Region': report.region || '',
        'Author Name': report.author || '',
        'Report Code': report.reportCode || '',
        'Number of Page': report.numberOfPages || '',
        'Price': report.price || '',
        'Excel Datapack Prices': report.excelDatapackPrice || '',
        'Single User Prices': report.singleUserPrice || '',
        'Enterprise License Prices': report.enterprisePrice || '',
        'Internet Handling Charges': report.internetHandlingCharges || '',
        'Currency': report.currency || '',
        'Format': report.format || '',
        'Language': report.language || '',
        'Industry': report.industry || '',
        'Report Type': report.reportType || '',
        'Status': report.status,
        'Featured': report.featured ? 'Yes' : 'No',
        'Popular': report.popular ? 'Yes' : 'No',
        'Publish Date': report.publishDate ? new Date(report.publishDate).toLocaleDateString() : '',
        'Last Updated': report.lastUpdated ? new Date(report.lastUpdated).toLocaleDateString() : new Date(report.updatedAt).toLocaleDateString(),
        'Excel Data Pack License': report.excelDataPackLicense || '',
        'Single User License': report.singleUserLicense || '',
        'Enterprise License Price': report.enterpriseLicensePrice || '',
        // SEO Fields
        'Title Tag': report.titleTag || '',
        'URL Slug': report.url || '',
        'Meta Description': report.metaDescription || '',
        'Keywords': report.keywords || ''
      }))
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      
      // Add styling to the worksheet
      const range = XLSX.utils.decode_range(worksheet['!ref'])
      
      // Style header row (row 0)
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!worksheet[cellAddress]) continue
        
        worksheet[cellAddress].s = {
          fill: { fgColor: { rgb: "4F46E5" } }, // Blue background
          font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 }, // White, bold text
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }
      }
      
      // Style data rows with alternating colors
      for (let row = 1; row <= range.e.r; row++) {
        const isEvenRow = row % 2 === 0
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (!worksheet[cellAddress]) continue
          
          worksheet[cellAddress].s = {
            fill: { fgColor: { rgb: isEvenRow ? "F8FAFC" : "FFFFFF" } }, // Alternating row colors
            font: { color: { rgb: "1F2937" }, sz: 10 }, // Dark gray text
            alignment: { horizontal: "left", vertical: "center", wrapText: true },
            border: {
              top: { style: "thin", color: { rgb: "E5E7EB" } },
              bottom: { style: "thin", color: { rgb: "E5E7EB" } },
              left: { style: "thin", color: { rgb: "E5E7EB" } },
              right: { style: "thin", color: { rgb: "E5E7EB" } }
            }
          }
        }
      }
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 50 }, // Report Title
        { wch: 30 }, // Title Meta Tag
        { wch: 40 }, // Report Overview
        { wch: 30 }, // Table of Contents
        { wch: 20 }, // Category
        { wch: 25 }, // Sub Category
        { wch: 30 }, // Segmentation
        { wch: 15 }, // Region
        { wch: 20 }, // Author Name
        { wch: 15 }, // Report Code
        { wch: 12 }, // Number of Page
        { wch: 12 }, // Price
        { wch: 15 }, // Excel Datapack Prices
        { wch: 15 }, // Single User Prices
        { wch: 18 }, // Enterprise License Prices
        { wch: 18 }, // Internet Handling Charges
        { wch: 10 }, // Currency
        { wch: 10 }, // Format
        { wch: 12 }, // Language
        { wch: 20 }, // Industry
        { wch: 15 }, // Report Type
        { wch: 10 }, // Status
        { wch: 8 },  // Featured
        { wch: 8 },  // Popular
        { wch: 15 }, // Publish Date
        { wch: 15 }, // Last Updated
        { wch: 20 }, // Excel Data Pack License
        { wch: 20 }, // Single User License
        { wch: 20 }, // Enterprise License Price
        { wch: 30 }, // Title Tag
        { wch: 25 }, // URL Slug
        { wch: 40 }, // Meta Description
        { wch: 30 }  // Keywords
      ]
      worksheet['!cols'] = columnWidths
      
      // Set row heights
      worksheet['!rows'] = [{ hpt: 25 }] // Header row height
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports')
      
      // Generate Excel buffer with styling support
      const excelBuffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        cellStyles: true
      })
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename=reports_export_${new Date().toISOString().split('T')[0]}.xlsx`)
      res.send(excelBuffer)
    } else {
      // CSV format
      const csvHeaders = ['Report Title', 'Title Meta Tag', 'REPORT OVERVIEW', 'Table of Contents', 'Category', 'Sub Category', 'SEGMENTATION', 'Region', 'Author Name', 'Report Code', 'Number of Page', 'Price', 'Excel Datapack Prices', 'Single User Prices', 'Enterprise License Prices', 'Internet Handling Charges', 'Currency', 'Status', 'Publish Date', 'Last Updated', 'Title Tag', 'URL Slug', 'Meta Description', 'Keywords']
      const csvRows = reports.map(report => [
        `"${(report.title || '').replace(/"/g, '""')}"`,
        `"${(report.subTitle || '').replace(/"/g, '""')}"`,
        `"${(report.summary || '').replace(/"/g, '""')}"`,
        `"${(report.tableOfContents || '').replace(/"/g, '""')}"`,
        `"${(report.category || report.domain || report.industry || '').replace(/"/g, '""')}"`,
        `"${(report.subCategory || report.subdomain || report.reportType || '').replace(/"/g, '""')}"`,
        `"${(report.segment || '').replace(/"/g, '""')}"`,
        `"${(report.region || '').replace(/"/g, '""')}"`,
        `"${report.author || ''}"`,
        `"${(report.reportCode || '').replace(/"/g, '""')}"`,
        `"${report.numberOfPages || ''}"`,
        `"${report.price || ''}"`,
        `"${report.excelDatapackPrice || ''}"`,
        `"${report.singleUserPrice || ''}"`,
        `"${report.enterprisePrice || ''}"`,
        `"${report.internetHandlingCharges || ''}"`,
        `"${report.currency || ''}"`,
        `"${report.status || ''}"`,
        `"${report.publishDate ? new Date(report.publishDate).toLocaleDateString() : ''}"`,
        `"${report.lastUpdated ? new Date(report.lastUpdated).toLocaleDateString() : new Date(report.updatedAt).toLocaleDateString()}"`,
        `"${(report.titleTag || '').replace(/"/g, '""')}"`,
        `"${(report.url || '').replace(/"/g, '""')}"`,
        `"${(report.metaDescription || '').replace(/"/g, '""')}"`,
        `"${(report.keywords || '').replace(/"/g, '""')}"`
      ])
      
      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n')
      
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=reports_export_${new Date().toISOString().split('T')[0]}.csv`)
      res.send(csvContent)
    }
  } catch (error) {
    console.error('Error exporting reports:', error)
    next(error)
  }
})

// POST /api/reports/check-duplicates - Check for duplicates before import
router.post('/check-duplicates', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No File',
        message: 'No file uploaded for duplicate check'
      });
    }

    let data;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    try {
      if (fileExtension === '.csv') {
        const workbook = XLSX.readFile(req.file.path, { 
          type: 'file',
          cellDates: true,
          cellNF: false,
          cellText: false
        });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      } else {
        const workbook = XLSX.readFile(req.file.path, {
          cellDates: true,
          cellNF: false,
          cellText: false
        });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      }
    } catch (fileError) {
      return res.status(400).json({
        error: 'File Reading Error',
        message: `Failed to read the uploaded file: ${fileError.message}`
      });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({
        error: 'Empty File',
        message: 'The uploaded file contains no data'
      });
    }

    // Check for duplicates in database
    const duplicates = [];
    const totalRecords = data.length;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Extract title and report code
      const title = row['Report Title'] || row['REPORT TITLE'] || row['Title'] || '';
      const reportCode = row['Report Code'] || row['REPORT CODE'] || row['Code'] || '';
      
      if (title.trim()) {
        // Check if report exists by title or report code
        const existingReport = await Report.findOne({
          $or: [
            { title: { $regex: new RegExp(`^${title.trim()}$`, 'i') } },
            ...(reportCode.trim() ? [{ reportCode: reportCode.trim() }] : [])
          ]
        });

        if (existingReport) {
          duplicates.push({
            row: i + 2, // Excel row number (1-indexed + header)
            title: title.trim(),
            reportCode: reportCode.trim(),
            existingId: existingReport._id
          });
        }
      }
    }

    // Clean up uploaded file
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }

    res.json({
      success: true,
      totalRecords,
      duplicates,
      duplicateCount: duplicates.length
    });

  } catch (error) {
    console.error('❌ Duplicate check error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }
    
    res.status(500).json({
      error: 'Duplicate Check Failed',
      message: error.message
    });
  }
})

// POST /api/reports/bulk-upload - Optimized bulk upload for 500+ records
router.post('/bulk-upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No File',
        message: 'No file uploaded for bulk import'
      });
    }

    let data;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    console.log(`📁 Processing file: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    try {
      if (fileExtension === '.csv') {
        // Handle CSV files with streaming for large files
        const workbook = XLSX.readFile(req.file.path, { 
          type: 'file',
          cellDates: true,
          cellNF: false,
          cellText: false
        });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      } else {
        // Handle Excel files (.xlsx, .xls) with optimized reading
        const workbook = XLSX.readFile(req.file.path, {
          cellDates: true,
          cellNF: false,
          cellText: false
        });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      }
    } catch (fileError) {
      console.error('❌ File reading error:', fileError);
      return res.status(400).json({
        error: 'File Reading Error',
        message: `Failed to read the uploaded file: ${fileError.message}`
      });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({
        error: 'Empty File',
        message: 'The uploaded file contains no data or has invalid format.'
      });
    }

    console.log(`🚀 Starting import of ${data.length} rows`);
    
    // Get duplicate handling preference
    const duplicateHandling = req.body.duplicateHandling || 'update';
    console.log(`🔄 Duplicate handling mode: ${duplicateHandling}`);
    
    // Validate file size for performance
    if (data.length > 1000) {
      console.log('⚠️  Large file detected, using optimized processing...');
    }
    
    // Optimized column detection and validation
    const allColumns = Object.keys(data[0] || {});
    const requiredColumns = ['Report Title', 'Title', 'Report Name'];
    const hasRequiredColumn = requiredColumns.some(col => allColumns.includes(col));
    
    if (!hasRequiredColumn) {
      return res.status(400).json({
        error: 'Invalid File Format',
        message: `Missing required title column. Expected one of: ${requiredColumns.join(', ')}`,
        availableColumns: allColumns
      });
    }
    
    console.log('🔍 Validating data structure...');

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors = [];
    
    // Dynamic batch size based on data volume
    const batchSize = data.length > 500 ? 25 : data.length > 100 ? 50 : 100;
    const reportBatch = [];
    
    console.log(`⚡ Processing ${data.length} reports in optimized batches of ${batchSize}`);
    
    // Pre-compile regex patterns for better performance
    const cleanTextRegex = /[\r\n\t]+/g;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Performance tracking
    const startTime = Date.now();
    let processedCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      processedCount++;
      
      // Progress logging for large datasets
      if (data.length > 100 && processedCount % 50 === 0) {
        const elapsed = Date.now() - startTime;
        const rate = processedCount / (elapsed / 1000);
        const eta = ((data.length - processedCount) / rate) / 60;
        console.log(`📈 Progress: ${processedCount}/${data.length} (${(processedCount/data.length*100).toFixed(1)}%) - ETA: ${eta.toFixed(1)}min`);
      }
      
      // Declare variables outside try block so they're accessible in catch block
      let cleanTitle = '';
      let cleanSubTitle = '';
      let cleanSegment = '';
      let cleanDescription = '';
      let cleanCompanies = '';
      let category = '';
      let subCategory = '';
      let reportCode = '';
      
      try {
        // Optimized field mapping with performance improvements
        const title = row['Report Title'] || row['Title'] || row['Report Name'] || row['title'] || '';
        
        // Try multiple variations for subtitle/meta tag with fallback
        const subTitle = row['Report Sub Title / Title Meta Tag'] || 
                        row['Title Meta Tag'] || 
                        row['Report Sub Title'] || 
                        row['Sub Title'] || 
                        row['Subtitle'] || 
                        row['subTitle'] || '';
        
        const summary = row['Summary'] || row['Description'] || row['summary'] || '';
        const content = row['Content'] || row['content'] || '';
        
        // Try multiple variations for report description - ENHANCED for REPORT OVERVIEW
        const reportDescription = row['REPORT OVERVIEW'] || 
                                 row['Report Overview'] || 
                                 row['Report Discription'] || 
                                 row['Report Description'] || 
                                 row['Description'] || 
                                 row['description'] || 
                                 row['Overview'] || '';
        
        const tableOfContents = row['Table of Contents'] || row['TOC'] || row['tableOfContents'] || '';
        
        // Map categories with more variations including new "Report Category" format
        category = row['Report Categories'] || 
                  row['Report Category'] || 
                  row['CATEGORIES'] || 
                  row['Categories'] || 
                  row['Category'] || 
                  row['Domain'] || 
                  row['category'] || '';
                  
        subCategory = row['Report Sub Category'] || 
                     row['Sub Category'] || 
                     row['Sub Domain'] || 
                     row['subCategory'] || '';
        
        // Try multiple variations for segment - ENHANCED for SEGMENTATION
        const segment = row['SEGMENTATION'] || 
                       row['Segmentation'] || 
                       row['Segment'] || 
                       row['segment'] || 
                       row['SEGMENT'] || 
                       row['Market Segmentation'] ||
                       row['Market Segment'] || '';
        
        // Try multiple variations for companies
        const companies = row['Companies'] || 
                         row['companies'] || 
                         row['COMPANIES'] || 
                         row['Company'] || 
                         row['company'] || '';
        
        // Extract SEO fields
        const titleTag = row['Title Tag'] || row['SEO Title'] || row['titleTag'] || '';
        const urlSlug = row['URL Slug'] || row['URL'] || row['url'] || row['Slug'] || '';
        const metaDescription = row['Meta Description'] || row['metaDescription'] || row['SEO Description'] || '';
        const keywords = row['Keywords'] || row['keywords'] || row['SEO Keywords'] || '';

        // Optimized cleaning and validation with regex
        cleanTitle = title ? title.toString().replace(cleanTextRegex, ' ').trim() : '';
        cleanSubTitle = subTitle ? subTitle.toString().replace(cleanTextRegex, ' ').trim() : '';
        cleanSegment = segment ? segment.toString().replace(cleanTextRegex, ' ').trim() : '';
        cleanDescription = reportDescription ? reportDescription.toString().replace(cleanTextRegex, ' ').trim() : '';
        cleanCompanies = companies ? companies.toString().replace(cleanTextRegex, ' ').trim() : '';
        
        // Clean SEO fields
        const cleanTitleTag = titleTag ? titleTag.toString().trim() : '';
        const cleanUrlSlug = urlSlug ? urlSlug.toString().trim() : '';
        const cleanMetaDescription = metaDescription ? metaDescription.toString().trim() : '';
        const cleanKeywords = keywords ? keywords.toString().trim() : '';

        const region = row['Region'] || row['region'] || '';
        const authorName = row['Author Name'] || row['Author'] || row['author'] || '';
        reportCode = row['Report Code'] || row['Code'] || row['reportCode'] || '';
        const numberOfPages = row['Number of Page'] || row['Pages'] || row['numberOfPages'] || '';
        const reportDate = row['Report Date'] || row['Date'] || row['reportDate'] || '';
        const publishDate = row['Publish Date'] || row['publishDate'] || '';
        const price = row['Price'] || row['price'] || '';
        const currency = row['Currency'] || row['currency'] || 'USD';
        const format = row['Format'] || row['format'] || 'PDF';
        const language = row['Language'] || row['language'] || 'English';
        const industry = row['Industry'] || row['industry'] || '';
        const reportType = row['Report Type'] || row['Type'] || row['reportType'] || 'Market Research';
        
        // Pricing fields - matching your Excel image exactly
        const excelDatapackPrice = row['Excel Datapack Prices'] || row['Excel Datapack Price'] || row['Excel Data Pack Prices'] || row['Excel Data Pack Price'] || row['excelDatapackPrice'] || '';
        const singleUserPrice = row['Single User License Prices'] || row['Single User Prices'] || row['Single User Price'] || row['singleUserPrice'] || '';
        const enterprisePrice = row['Enterprise License Prices'] || row['Enterprise Price'] || row['Enterprise Prices'] || row['enterprisePrice'] || '';
        const internetHandlingCharges = row['Internet Handling Charges'] || row['internetHandlingCharges'] || '';
        
        const {
          excelDataPackLicense = '',
          singleUserLicense = '',
          enterpriseLicensePrice = '',
          status = 'draft',
          featured = false,
          popular = false,
          ...otherFields
        } = row;

        // Enhanced validation with better error messages
        if (!cleanTitle || cleanTitle.length < 3) {
          failedCount++;
          errors.push({ 
            row: i + 1,
            reportCode: reportCode || 'N/A',
            error: cleanTitle ? 'Title too short (minimum 3 characters)' : 'Title is required'
          });
          continue;
        }
        
        // Additional validation for data quality
        if (cleanTitle.length > 500) {
          cleanTitle = cleanTitle.substring(0, 500) + '...';
        }


        let slug;
        try {
          slug = await generateUniqueSlug(cleanTitle);
        } catch (slugError) {
          console.error('Slug generation error:', slugError);
          throw new Error(`Failed to generate slug for title "${cleanTitle}": ${slugError.message}`);
        }

        const reportData = {
          title: cleanTitle,
          subTitle: cleanSubTitle,  // Maps from 'Report Sub Title / Title Meta Tag' Excel column
          slug,
          summary: summary?.toString().trim() || '',  // Keep existing summary field
          reportDescription: cleanDescription,  // Maps from 'Report Discription' Excel column
          content: content?.toString() || '',
          tableOfContents: tableOfContents?.toString() || '',
          category: category?.toString().trim() || '',
          subCategory: subCategory?.toString().trim() || '',
          region: region?.toString().trim() || '',
          reportCode: reportCode?.toString().trim() || '',
          numberOfPages: numberOfPages ? parseInt(numberOfPages) || 1 : 1,
          price: price ? parseFloat(price) || 0 : 0,
          currency: currency?.toString().toLowerCase() || 'usd',
          format: format?.toString().toLowerCase() || 'pdf',
          industry: industry?.toString().trim() || '',
          reportType: reportType?.toString() || 'market-research',
          
          // Excel import field mapping for frontend compatibility - USE EMPTY STRINGS NOT NULL
          reportDate: reportDate ? (isNaN(Date.parse(reportDate)) ? new Date() : new Date(reportDate)) : new Date(),
          reportCategories: (category?.toString().trim() && category.toString().trim() !== '') ? category.toString().trim() : '',
          segment: (cleanSegment && cleanSegment !== '') ? cleanSegment : '',
          companies: (cleanCompanies && cleanCompanies !== '') ? cleanCompanies : '',
          reportDescription: (cleanDescription && cleanDescription !== '') ? cleanDescription : '',
          
          // SEO fields from Excel import
          titleTag: (cleanTitleTag && cleanTitleTag !== '') ? cleanTitleTag : null,
          url: (cleanUrlSlug && cleanUrlSlug !== '') ? cleanUrlSlug : null,
          metaDescription: (cleanMetaDescription && cleanMetaDescription !== '') ? cleanMetaDescription : null,
          keywords: (cleanKeywords && cleanKeywords !== '') ? cleanKeywords : null,
          
          // Also map to category field for backward compatibility
          category: category?.toString().trim() || '',
          
          // Pricing fields - matching Excel image exactly
          excelDatapackPrice: excelDatapackPrice?.toString() || '',
          singleUserPrice: singleUserPrice?.toString() || '',
          enterprisePrice: enterprisePrice?.toString() || '',
          internetHandlingCharges: internetHandlingCharges?.toString() || '',
          
          // License fields (from Excel or defaults)
          excelDataPackLicense: excelDataPackLicense?.toString() || '',
          singleUserLicense: singleUserLicense?.toString() || '',
          enterpriseLicensePrice: enterpriseLicensePrice?.toString() || '',
          
          status: status || 'draft',
          featured: Boolean(featured),
          popular: Boolean(popular),
          tags: cleanSegment ? [cleanSegment] : [],  // Keep for backward compatibility
          author: authorName?.toString().trim() || req.user?.name || 'System',
          publishDate: publishDate ? (isNaN(Date.parse(publishDate)) ? new Date() : new Date(publishDate)) : new Date(),
          domain: category?.toString().trim() || '',
          subdomain: subCategory?.toString().trim() || ''
        };

        // Validate required fields
        if (!reportData.title || !reportData.slug) {
          throw new Error(`Missing required fields: title="${reportData.title}", slug="${reportData.slug}"`);
        }

        // Enhanced debugging for first few records only
        if (i < 3 && data.length <= 100) {
          console.log('🔍 COMPLETE EXCEL IMPORT DEBUG - About to save report data:', {
            title: reportData.title,
            'CRITICAL FIELDS': {
              'reportDescription': reportData.reportDescription,
              'segment': reportData.segment,
              'companies': reportData.companies,
              'reportCategories': reportData.reportCategories
            },
            'Excel Raw Values': {
              'REPORT OVERVIEW': row['REPORT OVERVIEW'],
              'SEGMENTATION': row['SEGMENTATION'],
              'COMPANIES': row['COMPANIES'],
              'CATEGORIES': row['CATEGORIES']
            },
            'Cleaned Values': {
              'cleanDescription': cleanDescription,
              'cleanSegment': cleanSegment,
              'cleanCompanies': cleanCompanies,
              'category': category
            }
          });
        }
        
        // Add to batch instead of saving immediately
        reportBatch.push(reportData);
        
        // Process batch when it reaches batchSize or is the last item
        if (reportBatch.length >= batchSize || i === data.length - 1) {
          console.log(`Processing batch of ${reportBatch.length} reports...`);
          
          // Optimized bulk processing with better error handling and duplicate prevention
          try {
            // Handle different duplicate strategies
            const bulkOps = [];
            
            for (const reportData of reportBatch) {
              const filter = reportData.reportCode && reportData.reportCode.trim() 
                ? { reportCode: reportData.reportCode }
                : { 
                    $or: [
                      { slug: reportData.slug },
                      { title: reportData.title }
                    ]
                  };
              
              if (duplicateHandling === 'skip') {
                // Skip duplicates - only insert if not exists
                const existing = await Report.findOne(filter);
                if (!existing) {
                  bulkOps.push({
                    insertOne: {
                      document: reportData
                    }
                  });
                } else {
                  skippedCount++;
                }
              } else if (duplicateHandling === 'create') {
                // Always create new - don't check for duplicates
                bulkOps.push({
                  insertOne: {
                    document: reportData
                  }
                });
              } else {
                // Default: update existing or create new (upsert)
                bulkOps.push({
                  updateOne: {
                    filter: filter,
                    update: { $set: reportData },
                    upsert: true
                  }
                });
              }
            }
            
            const bulkResult = await Report.bulkWrite(bulkOps, { 
              ordered: false,
              writeConcern: { w: 1 }
            });
            
            insertedCount += bulkResult.insertedCount || 0;
            updatedCount += bulkResult.modifiedCount || 0;
            insertedCount += bulkResult.upsertedCount || 0;
            
            if (data.length <= 100) {
              console.log(`✅ Batch completed: +${bulkResult.insertedCount || 0} new, ~${bulkResult.modifiedCount || 0} updated, ^${bulkResult.upsertedCount || 0} upserted`);
              if (bulkResult.modifiedCount > 0) {
                console.log(`🔄 ${bulkResult.modifiedCount} duplicate(s) detected and updated instead of creating new records`);
              }
            }
            
          } catch (bulkError) {
            console.error('❌ Bulk operation failed:', bulkError.message);
            
            // Fallback to individual processing for this batch with duplicate prevention
            for (const reportData of reportBatch) {
              try {
                let result;
                if (reportData.reportCode && reportData.reportCode.trim()) {
                  // Use reportCode as primary identifier
                  result = await Report.findOneAndUpdate(
                    { reportCode: reportData.reportCode },
                    reportData,
                    { new: true, upsert: true, runValidators: true }
                  );
                } else {
                  // Use title or slug to prevent duplicates
                  result = await Report.findOneAndUpdate(
                    { 
                      $or: [
                        { slug: reportData.slug },
                        { title: reportData.title }
                      ]
                    },
                    reportData,
                    { new: true, upsert: true, runValidators: true }
                  );
                }
                
                // Check if this was an insert or update
                if (result.isNew !== false) {
                  insertedCount++;
                } else {
                  updatedCount++;
                }
              } catch (individualError) {
                failedCount++;
                errors.push({
                  row: reportBatch.indexOf(reportData) + 1,
                  title: reportData.title || 'Unknown',
                  reportCode: reportData.reportCode || 'N/A',
                  error: individualError.message
                });
              }
            }
          }
          
          reportBatch.length = 0; // Clear the batch
          
          // Progress update for large files
          if (data.length > 100) {
            const progress = ((i + 1) / data.length * 100).toFixed(1);
            console.log(`📊 Progress: ${progress}% (${insertedCount + updatedCount} processed, ${failedCount} failed)`);
          }
        }
      } catch (error) {
        console.error('Error processing row:', error);
        console.error('Row data:', row);
        console.error('Processed data:', {
          cleanTitle, cleanSubTitle, cleanDescription, cleanSegment, category, subCategory
        });
        failedCount++;
        errors.push({ 
          title: cleanTitle || 'Unknown',
          reportCode: reportCode || 'Unknown',
          error: error.message,
          stack: error.stack,
          rowData: Object.keys(row).slice(0, 10).reduce((obj, key) => {
            obj[key] = row[key];
            return obj;
          }, {})
        });
      }
    }

    // Performance summary
    const totalTime = (Date.now() - startTime) / 1000;
    const rate = data.length / totalTime;
    
    console.log(`🎉 Import completed in ${totalTime.toFixed(2)}s (${rate.toFixed(1)} records/sec)`);
    console.log(`📊 Results: ${insertedCount} new, ${updatedCount} updated, ${failedCount} failed`);
    
    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('⚠️  Failed to cleanup uploaded file:', cleanupError.message);
    }

    const totalProcessed = insertedCount + updatedCount + skippedCount;
    const successRate = ((totalProcessed / data.length) * 100).toFixed(1);
    
    console.log(`📊 Final Results: ${insertedCount} new, ${updatedCount} updated, ${skippedCount} skipped, ${failedCount} failed`);
    
    res.status(201).json({
      success: true,
      message: `Import completed: ${totalProcessed}/${data.length} records processed (${successRate}% success rate)`,
      stats: {
        total: data.length,
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skippedCount,
        failed: failedCount,
        duplicates: skippedCount + updatedCount,
        successRate: parseFloat(successRate),
        processingTime: totalTime,
        recordsPerSecond: parseFloat(rate.toFixed(1))
      },
      errors: errors.slice(0, 10), // Limit errors in response
      note: failedCount > 0 ? `${failedCount} records failed. Check logs for details.` : 'All records processed successfully'
    });

  } catch (error) {
    console.error('❌ Critical error during bulk import:', error);
    
    // Clean up uploaded file
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('⚠️  Failed to cleanup uploaded file after error:', cleanupError.message);
      }
    }
    
    // Return structured error response
    res.status(500).json({
      success: false,
      error: 'Import Failed',
      message: error.message || 'An unexpected error occurred during import',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router
