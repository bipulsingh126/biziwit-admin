import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import HomePage from '../models/HomePage.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Configure multer for image uploads
const uploadDir = path.join(process.cwd(), 'public', 'images', 'homepage')

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const randomNum = Math.floor(Math.random() * 10000)
    const extension = path.extname(file.originalname).toLowerCase()
    const filename = `homepage-${timestamp}-${randomNum}${extension}`
    cb(null, filename)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'))
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
})

// GET /api/homepage - Get homepage data
router.get('/', async (req, res) => {
  try {
    let homepage = await HomePage.findOne({ slug: 'homepage' })
    
    // If no homepage exists, create default one
    if (!homepage) {
      homepage = await HomePage.createDefault()
    }

    res.json({
      success: true,
      data: homepage
    })
  } catch (error) {
    console.error('Error fetching homepage:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch homepage data',
      error: error.message
    })
  }
})

// PUT /api/homepage - Update homepage data
router.put('/', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const { pageTitle, pageSubtitle, seoData, banners, megatrends } = req.body

    let homepage = await HomePage.findOne({ slug: 'homepage' })
    
    if (!homepage) {
      homepage = await HomePage.createDefault()
    }

    // Update basic fields
    if (pageTitle) homepage.pageTitle = pageTitle
    if (pageSubtitle) homepage.pageSubtitle = pageSubtitle
    if (seoData) homepage.seoData = { ...homepage.seoData, ...seoData }

    // Update banners if provided
    if (banners && Array.isArray(banners)) {
      homepage.banners = banners
    }

    // Update megatrends if provided
    if (megatrends && Array.isArray(megatrends)) {
      homepage.megatrends = megatrends
    }

    homepage.lastUpdatedBy = req.user.id
    await homepage.save()

    res.json({
      success: true,
      message: 'Homepage updated successfully',
      data: homepage
    })
  } catch (error) {
    console.error('Error updating homepage:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update homepage',
      error: error.message
    })
  }
})

// PUT /api/homepage/banner/:slug - Update specific banner by slug
router.put('/banner/:slug', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const { slug } = req.params
    const updateData = req.body

    let homepage = await HomePage.findOne({ slug: 'homepage' })
    
    if (!homepage) {
      return res.status(404).json({
        success: false,
        message: 'Homepage not found'
      })
    }

    const banner = homepage.updateBannerBySlug(slug, updateData)
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      })
    }

    homepage.lastUpdatedBy = req.user.id
    await homepage.save()

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
    })
  } catch (error) {
    console.error('Error updating banner:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update banner',
      error: error.message
    })
  }
})

// POST /api/homepage/banner/:slug/image - Upload banner image by slug
router.post('/banner/:slug/image', authenticate, requireRole('super_admin', 'admin', 'editor'), (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'Image upload failed',
        error: err.message
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      })
    }

    try {
      const { slug } = req.params
      const imageUrl = `/images/homepage/${req.file.filename}`

      let homepage = await HomePage.findOne({ slug: 'homepage' })
      
      if (!homepage) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path)
        return res.status(404).json({
          success: false,
          message: 'Homepage not found'
        })
      }

      const banner = homepage.banners.find(b => b.slug === slug)
      
      if (!banner) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path)
        return res.status(404).json({
          success: false,
          message: 'Banner not found'
        })
      }

      // Remove old image if exists
      if (banner.image) {
        const oldImagePath = path.join(process.cwd(), 'public', banner.image)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }

      banner.image = imageUrl
      homepage.lastUpdatedBy = req.user.id
      await homepage.save()

      res.json({
        success: true,
        message: 'Banner image uploaded successfully',
        imageUrl: imageUrl,
        data: banner
      })
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      
      console.error('Error uploading banner image:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to upload banner image',
        error: error.message
      })
    }
  })
})

// DELETE /api/homepage/banner/:slug/image - Delete banner image by slug
router.delete('/banner/:slug/image', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const { slug } = req.params

    let homepage = await HomePage.findOne({ slug: 'homepage' })
    
    if (!homepage) {
      return res.status(404).json({
        success: false,
        message: 'Homepage not found'
      })
    }

    const banner = homepage.banners.find(b => b.slug === slug)
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      })
    }

    if (banner.image) {
      // Remove image file
      const imagePath = path.join(process.cwd(), 'public', banner.image)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
      
      banner.image = ''
      homepage.lastUpdatedBy = req.user.id
      await homepage.save()
    }

    res.json({
      success: true,
      message: 'Banner image deleted successfully',
      data: banner
    })
  } catch (error) {
    console.error('Error deleting banner image:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner image',
      error: error.message
    })
  }
})

// PUT /api/homepage/megatrend/:slug - Update specific megatrend by slug
router.put('/megatrend/:slug', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const { slug } = req.params
    const updateData = req.body

    let homepage = await HomePage.findOne({ slug: 'homepage' })
    
    if (!homepage) {
      return res.status(404).json({
        success: false,
        message: 'Homepage not found'
      })
    }

    const megatrend = homepage.updateMegatrendBySlug(slug, updateData)
    
    if (!megatrend) {
      return res.status(404).json({
        success: false,
        message: 'Megatrend not found'
      })
    }

    homepage.lastUpdatedBy = req.user.id
    await homepage.save()

    res.json({
      success: true,
      message: 'Megatrend updated successfully',
      data: megatrend
    })
  } catch (error) {
    console.error('Error updating megatrend:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update megatrend',
      error: error.message
    })
  }
})

// POST /api/homepage/megatrend/:slug/image - Upload megatrend image by slug
router.post('/megatrend/:slug/image', authenticate, requireRole('super_admin', 'admin', 'editor'), (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'Image upload failed',
        error: err.message
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      })
    }

    try {
      const { slug } = req.params
      const imageUrl = `/images/homepage/${req.file.filename}`

      let homepage = await HomePage.findOne({ slug: 'homepage' })
      
      if (!homepage) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path)
        return res.status(404).json({
          success: false,
          message: 'Homepage not found'
        })
      }

      const megatrend = homepage.megatrends.find(m => m.slug === slug)
      
      if (!megatrend) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path)
        return res.status(404).json({
          success: false,
          message: 'Megatrend not found'
        })
      }

      // Remove old image if exists
      if (megatrend.image) {
        const oldImagePath = path.join(process.cwd(), 'public', megatrend.image)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }

      megatrend.image = imageUrl
      homepage.lastUpdatedBy = req.user.id
      await homepage.save()

      res.json({
        success: true,
        message: 'Megatrend image uploaded successfully',
        imageUrl: imageUrl,
        data: megatrend
      })
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      
      console.error('Error uploading megatrend image:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to upload megatrend image',
        error: error.message
      })
    }
  })
})

// DELETE /api/homepage/megatrend/:slug/image - Delete megatrend image by slug
router.delete('/megatrend/:slug/image', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const { slug } = req.params

    let homepage = await HomePage.findOne({ slug: 'homepage' })
    
    if (!homepage) {
      return res.status(404).json({
        success: false,
        message: 'Homepage not found'
      })
    }

    const megatrend = homepage.megatrends.find(m => m.slug === slug)
    
    if (!megatrend) {
      return res.status(404).json({
        success: false,
        message: 'Megatrend not found'
      })
    }

    if (megatrend.image) {
      // Remove image file
      const imagePath = path.join(process.cwd(), 'public', megatrend.image)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
      
      megatrend.image = ''
      homepage.lastUpdatedBy = req.user.id
      await homepage.save()
    }

    res.json({
      success: true,
      message: 'Megatrend image deleted successfully',
      data: megatrend
    })
  } catch (error) {
    console.error('Error deleting megatrend image:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete megatrend image',
      error: error.message
    })
  }
})

// GET /api/homepage/analytics - Get homepage analytics
router.get('/analytics', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const homepage = await HomePage.findOne({ slug: 'homepage' })
    
    if (!homepage) {
      return res.status(404).json({
        success: false,
        message: 'Homepage not found'
      })
    }

    const analytics = {
      totalBanners: homepage.banners.length,
      activeBanners: homepage.banners.filter(b => b.isActive).length,
      bannersWithImages: homepage.banners.filter(b => b.image).length,
      totalMegatrends: homepage.megatrends.length,
      activeMegatrends: homepage.megatrends.filter(m => m.isActive).length,
      megatrendsWithImages: homepage.megatrends.filter(m => m.image).length,
      lastUpdated: homepage.updatedAt,
      lastUpdatedBy: homepage.lastUpdatedBy
    }

    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('Error fetching homepage analytics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch homepage analytics',
      error: error.message
    })
  }
})

export default router
