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
router.use(requireRole('admin', 'editor'))

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
      'metaTitle', 'metaDescription', 'metaKeywords',
      'ogTitle', 'ogDescription', 'ogImage',
      'twitterTitle', 'twitterDescription', 'twitterImage',
      'language', 'region', 'industry', 'reportType',
      'pages', 'format', 'price', 'currency'
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

export default router
