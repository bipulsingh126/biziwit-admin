import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import HomePage from '../models/HomePage.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// Image upload configuration
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'homepage')
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const randomNum = Math.floor(Math.random() * 10000)
    const extension = path.extname(file.originalname).toLowerCase()
    const filename = `homepage-${timestamp}-${randomNum}${extension}`
    cb(null, filename)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'))
    }
  }
})

// Middleware: Authentication required for all routes
router.use(authenticate)

// GET /api/homepage - Get homepage data
router.get('/', async (req, res, next) => {
  try {
    let homePage = await HomePage.findOne({ isActive: true })
      .populate('lastUpdatedBy', 'name email')
      .lean()

    // If no homepage exists, return empty structure
    if (!homePage) {
      homePage = {
        pageTitle: '',
        pageSubtitle: '',
        featuredSections: [],
        seoData: {
          title: '',
          metaDescription: '',
          keywords: ''
        },
        isActive: true,
        lastUpdatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    res.json({
      success: true,
      data: homePage
    })
  } catch (error) {
    console.error('Error fetching homepage data:', error)
    next(error)
  }
})

// PUT /api/homepage - Update homepage data
router.put('/', requireRole('super_admin', 'admin', 'editor'), async (req, res, next) => {
  try {
    const {
      pageTitle,
      pageSubtitle,
      featuredSections,
      seoData
    } = req.body

    // Validation - only page title is required
    if (!pageTitle || pageTitle.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Page title is required'
      })
    }

    // Ensure featuredSections is an array, default to empty array if not provided
    const sections = featuredSections && Array.isArray(featuredSections) ? featuredSections : []
    
    // Filter out completely empty sections
    const validSections = sections.filter(section => 
      (section.title && section.title.trim()) || 
      (section.description && section.description.trim()) || 
      (section.buttonText && section.buttonText.trim()) || 
      (section.image && section.image.trim())
    )

    console.log('Processing homepage update:', {
      pageTitle,
      pageSubtitle: pageSubtitle || '',
      originalSections: sections.length,
      validSections: validSections.length
    })

    let homePage = await HomePage.findOne({ isActive: true })

    if (!homePage) {
      // Create new homepage
      homePage = new HomePage({
        pageTitle,
        pageSubtitle: pageSubtitle || '',
        featuredSections: validSections.map((section, index) => ({
          title: section.title || '',
          description: section.description || '',
          image: section.image || '',
          buttonText: section.buttonText || '',
          buttonLink: section.buttonLink || '',
          layout: section.layout || 'right',
          sortOrder: index + 1,
          isActive: true
        })),
        seoData: seoData || {},
        lastUpdatedBy: req.user._id
      })
    } else {
      // Update existing homepage
      homePage.pageTitle = pageTitle
      homePage.pageSubtitle = pageSubtitle || ''
      homePage.featuredSections = validSections.map((section, index) => ({
        title: section.title || '',
        description: section.description || '',
        image: section.image || '',
        buttonText: section.buttonText || '',
        buttonLink: section.buttonLink || '',
        layout: section.layout || 'right',
        sortOrder: index + 1,
        isActive: true
      }))
      if (seoData) {
        homePage.seoData = { ...homePage.seoData, ...seoData }
      }
      homePage.lastUpdatedBy = req.user._id
    }

    await homePage.save()

    // Populate and return updated data
    const updatedHomePage = await HomePage.findById(homePage._id)
      .populate('lastUpdatedBy', 'name email')
      .lean()

    res.json({
      success: true,
      message: 'Homepage updated successfully',
      data: updatedHomePage
    })
  } catch (error) {
    console.error('Error updating homepage:', error)
    next(error)
  }
})

// POST /api/homepage/upload-image - Upload image for featured section
router.post('/upload-image', requireRole('super_admin', 'admin', 'editor'), (req, res) => {
  upload.single('image')(req, res, async (err) => {
    try {
      if (err) {
        console.error('Upload error:', err)
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed'
        })
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        })
      }

      // Verify file exists
      const filePath = req.file.path
      if (!fs.existsSync(filePath)) {
        return res.status(500).json({
          success: false,
          message: 'File upload failed - file not saved'
        })
      }

      const imageUrl = `/images/homepage/${req.file.filename}`

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: imageUrl,
        fullUrl: `${req.protocol}://${req.get('host')}${imageUrl}`,
        fileInfo: {
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error during upload'
      })
    }
  })
})

// DELETE /api/homepage/image/:filename - Delete uploaded image
router.delete('/image/:filename', requireRole('super_admin', 'admin', 'editor'), async (req, res, next) => {
  try {
    const { filename } = req.params
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      })
    }

    const filePath = path.join(UPLOAD_DIR, filename)
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      // Delete the file
      fs.unlinkSync(filePath)
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting image:', error)
    next(error)
  }
})

// GET /api/homepage/analytics - Get homepage analytics
router.get('/analytics', requireRole('super_admin', 'admin'), async (req, res, next) => {
  try {
    const homePage = await HomePage.findOne({ isActive: true })

    if (!homePage) {
      return res.json({
        success: true,
        data: {
          totalSections: 0,
          activeSections: 0,
          lastUpdated: null,
          lastUpdatedBy: null
        }
      })
    }

    const analytics = {
      totalSections: homePage.featuredSections.length,
      activeSections: homePage.featuredSections.filter(section => section.isActive).length,
      lastUpdated: homePage.updatedAt,
      lastUpdatedBy: homePage.lastUpdatedBy
    }

    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('Error fetching homepage analytics:', error)
    next(error)
  }
})

// POST /api/homepage/sections/:sectionId/toggle - Toggle section active status
router.post('/sections/:sectionId/toggle', requireRole('super_admin', 'admin', 'editor'), async (req, res, next) => {
  try {
    const { sectionId } = req.params
    
    const homePage = await HomePage.findOne({ isActive: true })
    if (!homePage) {
      return res.status(404).json({
        success: false,
        message: 'Homepage not found'
      })
    }

    const section = homePage.featuredSections.id(sectionId)
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Featured section not found'
      })
    }

    section.isActive = !section.isActive
    homePage.lastUpdatedBy = req.user._id
    await homePage.save()

    res.json({
      success: true,
      message: `Section ${section.isActive ? 'activated' : 'deactivated'} successfully`,
      data: section
    })
  } catch (error) {
    console.error('Error toggling section status:', error)
    next(error)
  }
})

export default router
