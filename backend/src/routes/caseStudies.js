import express from 'express'
import CaseStudy from '../models/CaseStudy.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import path from 'path'
import fs from 'fs'
import {
  caseStudyUpload,
  handleImageUploadResponse,
  handleUploadError,
  deleteImageFile,
  generateImageUrl
} from '../utils/imageUpload.js'

const router = express.Router()

// Get all case studies with pagination, search, and filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      slug = '',
      status,
      dateRange,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query

    // Build query
    const query = {}

    // For public access (non-authenticated), only show published case studies
    // Check if user is authenticated by looking for authorization header
    const isAuthenticated = req.headers.authorization;
    if (!isAuthenticated && !status) {
      // If not authenticated and no specific status filter, only show published
      query.status = 'published';
    }

    // Text search
    if (search.trim()) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { keywords: { $regex: search, $options: 'i' } }
      ];
    }

    // Slug filter
    if (slug.trim()) {
      query.slug = { $regex: slug, $options: 'i' };
    }

    // Status filter (overrides default published filter if specified)
    if (status) {
      query.status = status
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

    // Build sort object
    const sort = {}
    sort[sortBy] = order === 'asc' ? 1 : -1

    // Get paginated results
    const caseStudies = await CaseStudy.find(query)
      .sort(sort)
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

// Get single case study by slug
router.get('/by-slug/:slug', async (req, res) => {
  try {
    // Only return published case studies for public access
    const caseStudy = await CaseStudy.findOne({
      slug: req.params.slug,
      status: 'published'
    })
    if (!caseStudy) {
      return res.status(404).json({ error: 'Case study not found' })
    }
    res.json(caseStudy)
  } catch (error) {
    console.error('Error fetching case study by slug:', error)
    res.status(500).json({ error: 'Failed to fetch case study' })
  }
})

// Get case study statistics (MUST be before /:identifier route)
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const totalCaseStudies = await CaseStudy.countDocuments()
    const publishedCaseStudies = await CaseStudy.countDocuments({ status: 'published' })
    const draftCaseStudies = await CaseStudy.countDocuments({ status: 'draft' })
    const featuredCaseStudies = await CaseStudy.countDocuments({ featured: true })



    res.json({
      total: totalCaseStudies,
      published: publishedCaseStudies,
      draft: draftCaseStudies,
      featured: featuredCaseStudies
    })
  } catch (error) {
    console.error('Error fetching case study statistics:', error)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

// Utility route to populate slugs for existing case studies (MUST be before /:identifier route)
router.post('/utils/populate-slugs', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const updatedCount = await CaseStudy.populateSlugs();

    res.json({
      success: true,
      message: `Successfully populated slugs for ${updatedCount} case studies`,
      updatedCount
    });
  } catch (error) {
    console.error('Error populating case study slugs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to populate case study slugs',
      error: error.message
    });
  }
});

// Get single case study by slug or ID (with slug priority) - MUST be after specific routes
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params

    // Try to find by slug first, then by ID for backward compatibility
    let caseStudy = await CaseStudy.findOne({ slug: identifier })

    if (!caseStudy && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // If it looks like a MongoDB ObjectId, try finding by ID
      caseStudy = await CaseStudy.findById(identifier)
    }

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
      ...req.body
    }

    const caseStudy = new CaseStudy(caseStudyData)
    await caseStudy.save()

    res.status(201).json(caseStudy)
  } catch (error) {
    console.error('Error creating case study:', error)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Slug or URL already exists' })
    }
    res.status(400).json({ error: error.message })
  }
})

// Update case study by slug
router.patch('/by-slug/:slug', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findOneAndUpdate(
      { slug: req.params.slug },
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
      return res.status(400).json({ error: 'Slug or URL already exists' })
    }
    res.status(400).json({ error: error.message })
  }
})

// Update case study by ID (legacy support)
router.patch('/:id', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const { id } = req.params

    // Try to find by slug first, then by ID
    let caseStudy = await CaseStudy.findOne({ slug: id })

    if (!caseStudy && id.match(/^[0-9a-fA-F]{24}$/)) {
      caseStudy = await CaseStudy.findById(id)
    }

    if (!caseStudy) {
      return res.status(404).json({ error: 'Case study not found' })
    }

    // Update the case study
    Object.assign(caseStudy, req.body)
    await caseStudy.save()

    res.json(caseStudy)
  } catch (error) {
    console.error('Error updating case study:', error)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Slug or URL already exists' })
    }
    res.status(400).json({ error: error.message })
  }
})

// Delete case study by slug
router.delete('/by-slug/:slug', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findOneAndDelete({ slug: req.params.slug })
    if (!caseStudy) {
      return res.status(404).json({ error: 'Case study not found' })
    }

    // Delete associated image file if exists
    if (caseStudy.mainImage && !caseStudy.mainImage.startsWith('http')) {
      const imagePath = path.join(process.cwd(), caseStudy.mainImage)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    res.json({ message: 'Case study deleted successfully' })
  } catch (error) {
    console.error('Error deleting case study:', error)
    res.status(500).json({ error: 'Failed to delete case study' })
  }
})

// Delete case study by ID (legacy support)
router.delete('/:id', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params

    // Try to find by slug first, then by ID
    let caseStudy = await CaseStudy.findOne({ slug: id })

    if (!caseStudy && id.match(/^[0-9a-fA-F]{24}$/)) {
      caseStudy = await CaseStudy.findById(id)
    }

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

    // Delete the case study
    await CaseStudy.findByIdAndDelete(caseStudy._id)
    res.json({ message: 'Case study deleted successfully' })
  } catch (error) {
    console.error('Error deleting case study:', error)
    res.status(500).json({ error: 'Failed to delete case study' })
  }
})

// Upload case study image by slug
router.post('/by-slug/:slug/image', authenticate, requireRole('super_admin', 'admin', 'editor'), caseStudyUpload.single('file'), async (req, res) => {
  try {
    console.log('🚀 Starting case study image upload for slug:', req.params.slug)

    const caseStudy = await CaseStudy.findOne({ slug: req.params.slug })
    if (!caseStudy) {
      console.log('❌ Case study not found')
      return res.status(404).json({
        success: false,
        error: 'Case study not found'
      })
    }

    // Delete old image if exists
    if (caseStudy.mainImage) {
      const oldFilename = caseStudy.mainImage.split('/').pop();
      deleteImageFile('case-studies', oldFilename);
    }

    // Generate new image URL
    const imageUrl = generateImageUrl('case-studies', req.file.filename);

    // Update mainImage in database
    caseStudy.mainImage = imageUrl;
    await caseStudy.save();

    console.log('💾 Updated case study with image URL:', imageUrl)
    console.log('✅ Image upload completed successfully')

    // Use centralized response handler
    handleImageUploadResponse(req, res, 'case-studies');
  } catch (error) {
    console.error('❌ Error uploading case study image:', error)

    // Clean up uploaded file if database save fails
    if (req.file) {
      deleteImageFile('case-studies', req.file.filename);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
      details: error.message
    })
  }
})

// Upload case study image by ID (legacy support)
router.post('/:id/image', authenticate, requireRole('super_admin', 'admin', 'editor'), caseStudyUpload.single('file'), async (req, res) => {
  try {
    console.log('🚀 Starting case study image upload for ID:', req.params.id)

    const { id } = req.params

    // Try to find by slug first, then by ID
    let caseStudy = await CaseStudy.findOne({ slug: id })

    if (!caseStudy && id.match(/^[0-9a-fA-F]{24}$/)) {
      caseStudy = await CaseStudy.findById(id)
    }
    if (!caseStudy) {
      console.log('❌ Case study not found')
      return res.status(404).json({
        success: false,
        error: 'Case study not found'
      })
    }

    // Delete old image if exists
    if (caseStudy.mainImage) {
      const oldFilename = caseStudy.mainImage.split('/').pop();
      deleteImageFile('case-studies', oldFilename);
    }

    // Generate new image URL
    const imageUrl = generateImageUrl('case-studies', req.file.filename);

    // Update mainImage in database
    caseStudy.mainImage = imageUrl;
    await caseStudy.save();

    console.log('💾 Updated case study with image URL:', imageUrl)
    console.log('✅ Image upload completed successfully')

    // Use centralized response handler
    handleImageUploadResponse(req, res, 'case-studies');
  } catch (error) {
    console.error('❌ Error uploading case study image:', error)

    // Clean up uploaded file if database save fails
    if (req.file) {
      deleteImageFile('case-studies', req.file.filename);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
      details: error.message
    })
  }
})


// Test endpoint to debug slug functionality
router.get('/test/debug-slugs', async (req, res) => {
  try {
    const caseStudies = await CaseStudy.find({}).limit(5).select('title slug url _id');
    const totalCaseStudies = await CaseStudy.countDocuments();

    res.json({
      success: true,
      message: 'Case Study slug debug information',
      totalCaseStudies,
      sampleCaseStudies: caseStudies,
      testInstructions: {
        bySlug: '/api/case-studies/by-slug/{slug}',
        byId: '/api/case-studies/{id}',
        byIdentifier: '/api/case-studies/{slug-or-id}'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router
