import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import Testimonial from '../models/Testimonial.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Utility function to generate unique slug
const generateUniqueSlug = async (text) => {
  const baseSlug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)

  let slug = baseSlug
  let counter = 1

  while (await Testimonial.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

// Setup multer for image uploads
const uploadDir = path.join(process.cwd(), 'public', 'images', 'testimonials')

// Create directory if it doesn't exist
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
    const filename = `testimonial-${timestamp}-${randomNum}${extension}`
    cb(null, filename)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
})

// Get all testimonials
router.get('/', async (req, res) => {
  try {
    const { q, limit = 10, offset = 0, isActive } = req.query

    let filter = {}

    // Search filter
    if (q && q.trim()) {
      filter.$or = [
        { quote: { $regex: q, $options: 'i' } },
        { clientName: { $regex: q, $options: 'i' } },
        { clientCompany: { $regex: q, $options: 'i' } }
      ]
    }

    // Active filter
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true'
    }

    const total = await Testimonial.countDocuments(filter)
    const testimonials = await Testimonial.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))

    res.json({
      success: true,
      items: testimonials,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + parseInt(limit) < total
    })
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    res.status(500).json({ error: 'Failed to fetch testimonials' })
  }
})

// Get single testimonial by ID or slug
router.get('/:idOrSlug', async (req, res) => {
  try {
    let testimonial

    // Try to find by ID first
    if (req.params.idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      testimonial = await Testimonial.findById(req.params.idOrSlug)
    }

    // If not found by ID, try by slug
    if (!testimonial) {
      testimonial = await Testimonial.findOne({ slug: req.params.idOrSlug })
    }

    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' })
    }

    res.json({ success: true, data: testimonial })
  } catch (error) {
    console.error('Error fetching testimonial:', error)
    res.status(500).json({ error: 'Failed to fetch testimonial' })
  }
})

// Create testimonial
router.post('/', authenticate, requireRole('super_admin', 'admin', 'editor'), upload.single('image'), async (req, res) => {
  try {
    const { quote, clientName, clientTitle, clientCompany, rating, isActive, sortOrder } = req.body

    // Validation
    if (!quote || !clientName || !clientTitle || !clientCompany) {
      return res.status(400).json({ error: 'Please provide all required fields' })
    }

    // Generate unique slug from clientName
    const slug = await generateUniqueSlug(clientName)

    // Handle image if uploaded
    let imageUrl = ''
    if (req.file) {
      imageUrl = `/images/testimonials/${req.file.filename}`
    }

    const testimonial = new Testimonial({
      quote,
      clientName,
      clientTitle,
      clientCompany,
      clientImage: imageUrl,
      slug,
      rating: rating || 5,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0
    })

    await testimonial.save()
    res.status(201).json({ success: true, data: testimonial })
  } catch (error) {
    console.error('Error creating testimonial:', error)
    // Clean up uploaded file on error
    if (req.file) {
      const filePath = path.join(uploadDir, req.file.filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    res.status(500).json({ error: error.message || 'Failed to create testimonial' })
  }
})

// Update testimonial
router.put('/:id', authenticate, requireRole('super_admin', 'admin', 'editor'), upload.single('image'), async (req, res) => {
  try {
    const { quote, clientName, clientTitle, clientCompany, rating, isActive, sortOrder } = req.body

    // Validation
    if (!quote || !clientName || !clientTitle || !clientCompany) {
      return res.status(400).json({ error: 'Please provide all required fields' })
    }

    // Get existing testimonial to check if clientName changed
    const existingTestimonial = await Testimonial.findById(req.params.id)
    if (!existingTestimonial) {
      return res.status(404).json({ error: 'Testimonial not found' })
    }

    // Generate new slug if clientName changed
    let slug = existingTestimonial.slug
    if (clientName !== existingTestimonial.clientName) {
      slug = await generateUniqueSlug(clientName)
    }

    // Handle image if uploaded
    let imageUrl = existingTestimonial.clientImage
    if (req.file) {
      // Delete old image if exists
      if (existingTestimonial.clientImage) {
        const oldImagePath = path.join(process.cwd(), 'public', existingTestimonial.clientImage)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }
      imageUrl = `/images/testimonials/${req.file.filename}`
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      {
        quote,
        clientName,
        clientTitle,
        clientCompany,
        clientImage: imageUrl,
        slug,
        rating: rating || 5,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    )

    res.json({ success: true, data: testimonial })
  } catch (error) {
    console.error('Error updating testimonial:', error)
    // Clean up uploaded file on error
    if (req.file) {
      const filePath = path.join(uploadDir, req.file.filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    res.status(500).json({ error: error.message || 'Failed to update testimonial' })
  }
})

// Delete testimonial
router.delete('/:id', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id)

    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' })
    }

    // Delete image if exists
    if (testimonial.clientImage) {
      const imagePath = path.join(process.cwd(), 'public', testimonial.clientImage)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    res.json({ success: true, message: 'Testimonial deleted successfully' })
  } catch (error) {
    console.error('Error deleting testimonial:', error)
    res.status(500).json({ error: 'Failed to delete testimonial' })
  }
})

// Upload testimonial image
router.post('/:id/upload-image', authenticate, requireRole('super_admin', 'admin', 'editor'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' })
    }

    const testimonial = await Testimonial.findById(req.params.id)
    if (!testimonial) {
      // Delete uploaded file if testimonial not found
      fs.unlinkSync(path.join(uploadDir, req.file.filename))
      return res.status(404).json({ error: 'Testimonial not found' })
    }

    // Delete old image if exists
    if (testimonial.clientImage) {
      const oldImagePath = path.join(process.cwd(), 'public', testimonial.clientImage)
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath)
      }
    }

    // Update testimonial with new image
    const imageUrl = `/images/testimonials/${req.file.filename}`
    testimonial.clientImage = imageUrl
    await testimonial.save()

    res.json({
      success: true,
      imageUrl,
      fullUrl: `http://localhost:4000${imageUrl}`,
      message: 'Image uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(path.join(uploadDir, req.file.filename))
    }
    res.status(500).json({ error: error.message || 'Failed to upload image' })
  }
})

// Delete testimonial image
router.delete('/:id/image', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id)
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' })
    }

    if (testimonial.clientImage) {
      const imagePath = path.join(process.cwd(), 'public', testimonial.clientImage)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
      testimonial.clientImage = ''
      await testimonial.save()
    }

    res.json({ success: true, message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Error deleting image:', error)
    res.status(500).json({ error: 'Failed to delete image' })
  }
})

export default router
