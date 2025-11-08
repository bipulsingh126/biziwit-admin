import express from 'express'
import CaseStudy from '../models/CaseStudy.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'case-studies')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `case-study-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// Get all case studies with pagination, search, and filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      author,
      dateRange
    } = req.query

    // Build query
    const query = {}
    
    // Text search
    if (search) {
      query.$text = { $search: search }
    }
    
    // Status filter
    if (status) {
      query.status = status
    }
    
    // Author filter
    if (author) {
      query.authorName = new RegExp(author, 'i')
    }
    
    // Date range filter
    if (dateRange) {
      const now = new Date()
      let startDate
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }
      
      if (startDate) {
        query.createdAt = { $gte: startDate }
      }
    }

    // Manual pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Get total count for pagination
    const total = await CaseStudy.countDocuments(query)
    
    // Get paginated results
    const caseStudies = await CaseStudy.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
    
    const totalPages = Math.ceil(total / limitNum)
    
    res.json({
      data: caseStudies,
      total: total,
      page: pageNum,
      pages: totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    })
  } catch (error) {
    console.error('Error fetching case studies:', error)
    res.status(500).json({ error: 'Failed to fetch case studies' })
  }
})

// Get single case study
router.get('/:id', async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findById(req.params.id)
    if (!caseStudy) {
      return res.status(404).json({ error: 'Case study not found' })
    }
    res.json(caseStudy)
  } catch (error) {
    console.error('Error fetching case study:', error)
    res.status(500).json({ error: 'Failed to fetch case study' })
  }
})

// Create new case study
router.post('/', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const caseStudyData = {
      ...req.body,
      authorName: req.body.authorName || req.user.name
    }
    
    const caseStudy = new CaseStudy(caseStudyData)
    await caseStudy.save()
    
    res.status(201).json(caseStudy)
  } catch (error) {
    console.error('Error creating case study:', error)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'URL slug already exists' })
    }
    res.status(400).json({ error: error.message })
  }
})

// Update case study
router.patch('/:id', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    
    if (!caseStudy) {
      return res.status(404).json({ error: 'Case study not found' })
    }
    
    res.json(caseStudy)
  } catch (error) {
    console.error('Error updating case study:', error)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'URL slug already exists' })
    }
    res.status(400).json({ error: error.message })
  }
})

// Delete case study
router.delete('/:id', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findById(req.params.id)
    if (!caseStudy) {
      return res.status(404).json({ error: 'Case study not found' })
    }
    
    // Delete associated image file if exists
    if (caseStudy.mainImage) {
      const imagePath = path.join(process.cwd(), 'uploads', 'case-studies', path.basename(caseStudy.mainImage))
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }
    
    await CaseStudy.findByIdAndDelete(req.params.id)
    res.json({ message: 'Case study deleted successfully' })
  } catch (error) {
    console.error('Error deleting case study:', error)
    res.status(500).json({ error: 'Failed to delete case study' })
  }
})

// Upload case study image (single image only)
router.post('/:id/image', authenticate, requireRole('super_admin', 'admin', 'editor'), upload.single('file'), async (req, res) => {
  try {
    console.log('🚀 Starting case study image upload for ID:', req.params.id)
    
    if (!req.file) {
      console.log('❌ No file uploaded')
      return res.status(400).json({ error: 'No file uploaded' })
    }
    
    console.log('📸 File details:', {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    })
    
    const caseStudy = await CaseStudy.findById(req.params.id)
    if (!caseStudy) {
      console.log('❌ Case study not found')
      return res.status(404).json({ error: 'Case study not found' })
    }
    
    const imageUrl = `/uploads/case-studies/${req.file.filename}`
    console.log('🖼️ Generated image URL:', imageUrl)
    
    // Verify file exists on disk
    const filePath = path.join(process.cwd(), 'uploads', 'case-studies', req.file.filename)
    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found on disk:', filePath)
      return res.status(500).json({ error: 'File upload failed - file not saved' })
    }
    
    // Delete old image if exists
    if (caseStudy.mainImage) {
      const oldImagePath = path.join(process.cwd(), 'uploads', 'case-studies', path.basename(caseStudy.mainImage))
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath)
        console.log('🗑️ Deleted old image:', oldImagePath)
      }
    }
    
    // Update mainImage in database
    caseStudy.mainImage = imageUrl
    await caseStudy.save()
    
    console.log('💾 Updated case study with image URL:', imageUrl)
    console.log('✅ Image upload completed successfully')
    
    res.json({ 
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      fullUrl: `http://localhost:4000${imageUrl}`,
      fileInfo: {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    })
  } catch (error) {
    console.error('❌ Error uploading image:', error)
    
    // Clean up uploaded file if database save fails
    if (req.file) {
      const filePath = path.join(process.cwd(), 'uploads', 'case-studies', req.file.filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log('🗑️ Cleaned up failed upload file')
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: error.message 
    })
  }
})


// Get case study statistics
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const totalCaseStudies = await CaseStudy.countDocuments()
    const publishedCaseStudies = await CaseStudy.countDocuments({ status: 'published' })
    const draftCaseStudies = await CaseStudy.countDocuments({ status: 'draft' })
    const featuredCaseStudies = await CaseStudy.countDocuments({ featured: true })
    
    // Get case studies by author
    const caseStudiesByAuthor = await CaseStudy.aggregate([
      {
        $group: {
          _id: '$authorName',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
    
    res.json({
      total: totalCaseStudies,
      published: publishedCaseStudies,
      draft: draftCaseStudies,
      featured: featuredCaseStudies,
      byAuthor: caseStudiesByAuthor
    })
  } catch (error) {
    console.error('Error fetching case study statistics:', error)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

export default router
