import { Router } from 'express'
import Category from '../models/Category.js'
import Report from '../models/Report.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// Middleware: Authentication required for all routes
// router.use(authenticate)
// router.use(requireRole('super_admin', 'admin', 'editor'))

// GET /api/categories - List all categories with subcategories
router.get('/', async (req, res, next) => {
  try {
    const { includeInactive = false } = req.query
    
    const query = includeInactive === 'true' ? {} : { isActive: true }
    
    const categories = await Category.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .lean()
    
    // Get report counts for each category and subcategory
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const reportCount = await Report.countDocuments({ 
          category: category.name,
          status: { $ne: 'archived' }
        })
        
        // Get subcategory counts
        const subcategoriesWithCounts = await Promise.all(
          category.subcategories.map(async (sub) => {
            const subReportCount = await Report.countDocuments({
              category: category.name,
              subCategory: sub.name,
              status: { $ne: 'archived' }
            })
            return {
              ...sub,
              reportCount: subReportCount
            }
          })
        )
        
        return {
          ...category,
          reportCount,
          subcategories: subcategoriesWithCounts
        }
      })
    )
    
    res.json({
      success: true,
      data: categoriesWithCounts,
      total: categoriesWithCounts.length
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    next(error)
  }
})

// GET /api/categories/trending - Get top 10 trending industries
router.get('/trending', async (req, res, next) => {
  try {
    // Get categories marked as trending first, then by report count
    const categories = await Category.find({ isActive: true })
      .sort({ isTopTrending: -1, sortOrder: 1, name: 1 })
      .lean()
    
    // Get report counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const reportCount = await Report.countDocuments({ 
          category: category.name,
          status: { $ne: 'archived' }
        })
        
        return {
          _id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          reportCount,
          subcategoriesCount: category.subcategories?.length || 0,
          isTopTrending: category.isTopTrending || false
        }
      })
    )
    
    // Sort by trending status first, then by report count (descending) and take top 10
    const trendingCategories = categoriesWithCounts
      .sort((a, b) => {
        // First sort by isTopTrending (trending categories first)
        if (a.isTopTrending && !b.isTopTrending) return -1
        if (!a.isTopTrending && b.isTopTrending) return 1
        // Then sort by report count (descending)
        return (b.reportCount || 0) - (a.reportCount || 0)
      })
      .slice(0, 10)
    
    res.json({
      success: true,
      data: trendingCategories,
      total: trendingCategories.length
    })
  } catch (error) {
    console.error('Error fetching trending categories:', error)
    next(error)
  }
})

// GET /api/categories/subcategories/trending - Get top trending subcategories
router.get('/subcategories/trending', async (req, res, next) => {
  try {
    const { limit = 10, categorySlug } = req.query
    
    // Build query for categories
    const categoryQuery = { isActive: true }
    if (categorySlug) {
      categoryQuery.slug = categorySlug
    }
    
    // Get all categories with their subcategories
    const categories = await Category.find(categoryQuery)
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      
    console.log(`🏷️ Found ${categories.length} categories for trending subcategories`)
    
    // Flatten all subcategories with their parent category info
    const allSubcategories = []
    
    for (const category of categories) {
      if (category.subcategories && category.subcategories.length > 0) {
        for (const subcategory of category.subcategories) {
          if (subcategory.isActive !== false) { // Include active subcategories
            // Get report count for this subcategory
            const reportCount = await Report.countDocuments({
              category: category.name,
              subCategory: subcategory.name,
              status: { $ne: 'archived' }
            })
            
            console.log(`📊 Subcategory: ${subcategory.name} in ${category.name} has ${reportCount} reports`)
            
            allSubcategories.push({
              _id: subcategory._id,
              name: subcategory.name,
              slug: subcategory.slug,
              description: subcategory.description || '',
              reportCount,
              isTopTrending: subcategory.isTopTrending || false,
              category: {
                _id: category._id,
                name: category.name,
                slug: category.slug,
                description: category.description || ''
              }
            })
            
            console.log(`  ✅ Added subcategory: ${subcategory.name} (${reportCount} reports)`)
          }
        }
      }
    }
    
    // Sort by trending status first, then by report count (descending)
    const trendingSubcategories = allSubcategories
      .sort((a, b) => {
        // First sort by isTopTrending (trending subcategories first)
        if (a.isTopTrending && !b.isTopTrending) return -1
        if (!a.isTopTrending && b.isTopTrending) return 1
        // Then sort by report count (descending)
        return (b.reportCount || 0) - (a.reportCount || 0)
      })
      .slice(0, parseInt(limit))
      
    console.log(`🔥 Returning ${trendingSubcategories.length} trending subcategories out of ${allSubcategories.length} total`)
    
    res.json({
      success: true,
      data: trendingSubcategories,
      total: trendingSubcategories.length,
      filters: {
        categorySlug: categorySlug || null,
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching trending subcategories:', error)
    next(error)
  }
})

// PUT /api/categories/:categoryId/subcategories/:subcategoryId/trending - Toggle subcategory trending status
router.put('/:categoryId/subcategories/:subcategoryId/trending', async (req, res, next) => {
  try {
    const { categoryId, subcategoryId } = req.params
    const { isTopTrending } = req.body
    
    const category = await Category.findById(categoryId)
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      })
    }
    
    const subcategory = category.subcategories.id(subcategoryId)
    
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        error: 'Subcategory not found'
      })
    }
    
    // Update trending status
    subcategory.isTopTrending = Boolean(isTopTrending)
    
    await category.save()
    
    res.json({
      success: true,
      data: {
        categoryId,
        subcategoryId,
        subcategoryName: subcategory.name,
        isTopTrending: subcategory.isTopTrending
      },
      message: `Subcategory "${subcategory.name}" ${isTopTrending ? 'added to' : 'removed from'} trending list`
    })
  } catch (error) {
    console.error('Error updating subcategory trending status:', error)
    next(error)
  }
})

// POST /api/categories/subcategories/bulk-trending - Bulk update trending status for multiple subcategories
router.post('/subcategories/bulk-trending', async (req, res, next) => {
  try {
    const { subcategoryUpdates, isTopTrending } = req.body
    
    if (!Array.isArray(subcategoryUpdates) || subcategoryUpdates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'subcategoryUpdates array is required'
      })
    }
    
    const results = []
    
    for (const update of subcategoryUpdates) {
      const { categoryId, subcategoryId } = update
      
      try {
        const category = await Category.findById(categoryId)
        
        if (category) {
          const subcategory = category.subcategories.id(subcategoryId)
          
          if (subcategory) {
            subcategory.isTopTrending = Boolean(isTopTrending)
            await category.save()
            
            results.push({
              categoryId,
              subcategoryId,
              subcategoryName: subcategory.name,
              success: true,
              isTopTrending: subcategory.isTopTrending
            })
          } else {
            results.push({
              categoryId,
              subcategoryId,
              success: false,
              error: 'Subcategory not found'
            })
          }
        } else {
          results.push({
            categoryId,
            subcategoryId,
            success: false,
            error: 'Category not found'
          })
        }
      } catch (err) {
        results.push({
          categoryId,
          subcategoryId,
          success: false,
          error: err.message
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const statusText = isTopTrending ? 'added to' : 'removed from'
    
    res.json({
      success: true,
      data: results,
      summary: {
        total: subcategoryUpdates.length,
        successful: successCount,
        failed: subcategoryUpdates.length - successCount
      },
      message: `${successCount} subcategories ${statusText} trending list`
    })
  } catch (error) {
    console.error('Error bulk updating subcategory trending status:', error)
    next(error)
  }
})

// GET /api/categories/by-slug/:slug - Get category by slug
router.get('/by-slug/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params
    const { includeSubcategories = true } = req.query
    
    const category = await Category.findOne({ 
      slug: slug,
      isActive: true 
    }).lean()
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      })
    }
    
    // Get report count for the category
    const reportCount = await Report.countDocuments({ 
      category: category.name,
      status: { $ne: 'archived' }
    })
    
    let subcategoriesWithCounts = []
    
    if (includeSubcategories === 'true' && category.subcategories) {
      // Get report counts for each subcategory
      subcategoriesWithCounts = await Promise.all(
        category.subcategories.map(async (sub) => {
          const subReportCount = await Report.countDocuments({
            category: category.name,
            subCategory: sub.name,
            status: { $ne: 'archived' }
          })
          return {
            ...sub,
            reportCount: subReportCount
          }
        })
      )
    }
    
    const result = {
      ...category,
      reportCount,
      subcategories: subcategoriesWithCounts
    }
    
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching category by slug:', error)
    next(error)
  }
})

// GET /api/categories/:categorySlug/subcategories/:subcategorySlug - Get subcategory by slug
router.get('/:categorySlug/subcategories/:subcategorySlug', async (req, res, next) => {
  try {
    const { categorySlug, subcategorySlug } = req.params
    
    const category = await Category.findOne({ 
      slug: categorySlug,
      isActive: true 
    }).lean()
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      })
    }
    
    const subcategory = category.subcategories.find(sub => 
      sub.slug === subcategorySlug && sub.isActive !== false
    )
    
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        error: 'Subcategory not found'
      })
    }
    
    // Get report count for this subcategory
    const reportCount = await Report.countDocuments({
      category: category.name,
      subCategory: subcategory.name,
      status: { $ne: 'archived' }
    })
    
    const result = {
      ...subcategory,
      reportCount,
      category: {
        _id: category._id,
        name: category.name,
        slug: category.slug,
        description: category.description
      }
    }
    
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching subcategory by slug:', error)
    next(error)
  }
})

// GET /api/categories/:id - Get single category
router.get('/:id', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      })
    }
    
    res.json({
      success: true,
      data: category
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    next(error)
  }
})

// POST /api/categories - Create new category
router.post('/', async (req, res, next) => {
  try {
    const { name, description, subcategories = [], isTopTrending = false } = req.body
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      })
    }
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    })
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Category with this name already exists'
      })
    }
    
    // Get the highest sort order
    const lastCategory = await Category.findOne().sort({ sortOrder: -1 })
    const sortOrder = lastCategory ? lastCategory.sortOrder + 1 : 0
    
    // Generate slug for main category
    let baseSlug = name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Ensure slug is not empty
    if (!baseSlug) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category name - cannot generate slug'
      })
    }

    // Check for existing slug and make it unique if needed
    let slug = baseSlug
    let counter = 1
    while (await Category.findOne({ slug: slug })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const category = new Category({
      name: name.trim(),
      slug: slug,
      description: description?.trim() || '',
      sortOrder,
      isTopTrending: Boolean(isTopTrending),
      subcategories: subcategories.map((sub, index) => {
        const subSlug = sub.name.trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
        
        return {
          name: sub.name.trim(),
          slug: subSlug || `subcategory-${index}`, // Fallback slug
          description: sub.description?.trim() || '',
          sortOrder: index
        }
      })
    })
    
    
    await category.save()
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    })
  } catch (error) {
    console.error('Error creating category:', error)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Category with this name already exists'
      })
    }
    next(error)
  }
})

// PUT /api/categories/:id - Update category
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, isActive, subcategories, isTopTrending } = req.body
    
    const category = await Category.findById(req.params.id)
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      })
    }
    
    // Check if name is being changed and if it conflicts
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      })
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: 'Category with this name already exists'
        })
      }
    }
    
    // Update fields
    if (name !== undefined) {
      category.name = name.trim()
      // Update slug when name changes
      category.slug = name.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }
    if (description !== undefined) category.description = description.trim()
    if (isActive !== undefined) category.isActive = isActive
    if (isTopTrending !== undefined) {
      console.log(`Updating category ${category.name} trending status to:`, Boolean(isTopTrending))
      category.isTopTrending = Boolean(isTopTrending)
    }
    
    // Update subcategories if provided
    if (subcategories !== undefined) {
      category.subcategories = subcategories.map((sub, index) => ({
        _id: sub._id, // Keep existing ID if updating
        name: sub.name.trim(),
        slug: sub.slug || sub.name.trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        description: sub.description?.trim() || '',
        isActive: sub.isActive !== undefined ? sub.isActive : true,
        sortOrder: index
      }))
    }
    
    await category.save()
    
    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    })
  } catch (error) {
    console.error('Error updating category:', error)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Category with this name already exists'
      })
    }
    next(error)
  }
})

// DELETE /api/categories/:id - Delete category
router.delete('/:id', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      })
    }
    
    // Check if category is being used by any reports
    const reportCount = await Report.countDocuments({ 
      category: category.name,
      status: { $ne: 'archived' }
    })
    
    if (reportCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. It is being used by ${reportCount} report(s). Please reassign or archive those reports first.`
      })
    }
    
    await Category.findByIdAndDelete(req.params.id)
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    next(error)
  }
})

// POST /api/categories/:id/subcategories - Add subcategory
router.post('/:id/subcategories', async (req, res, next) => {
  try {
    const { name, description } = req.body
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Subcategory name is required'
      })
    }
    
    const category = await Category.findById(req.params.id)
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      })
    }
    
    // Check if subcategory already exists
    const exists = category.subcategories.some(sub => 
      sub.name.toLowerCase() === name.trim().toLowerCase()
    )
    
    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'Subcategory with this name already exists'
      })
    }
    
    // Generate slug for subcategory
    const slug = name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Ensure slug is not empty, use fallback if needed
    const finalSlug = slug || `subcategory-${Date.now()}`


    category.subcategories.push({
      name: name.trim(),
      slug: finalSlug,
      description: description?.trim() || '',
      sortOrder: category.subcategories.length
    })
    
    await category.save()
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Subcategory added successfully'
    })
  } catch (error) {
    console.error('Error adding subcategory:', error)
    next(error)
  }
})

// DELETE /api/categories/:id/subcategories/:subId - Remove subcategory
router.delete('/:id/subcategories/:subId', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      })
    }
    
    const subcategory = category.subcategories.id(req.params.subId)
    
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        error: 'Subcategory not found'
      })
    }
    
    // Check if subcategory is being used by any reports
    const reportCount = await Report.countDocuments({
      category: category.name,
      subCategory: subcategory.name,
      status: { $ne: 'archived' }
    })
    
    if (reportCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete subcategory. It is being used by ${reportCount} report(s). Please reassign or archive those reports first.`
      })
    }
    
    category.subcategories.pull(req.params.subId)
    await category.save()
    
    res.json({
      success: true,
      message: 'Subcategory deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting subcategory:', error)
    next(error)
  }
})

// POST /api/categories/seed - Seed initial categories
router.post('/seed', async (req, res, next) => {
  try {
    const existingCount = await Category.countDocuments()
    if (existingCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Categories already exist'
      })
    }
    
    const seedCategories = [
      {
        name: 'Aerospace & Defense',
        description: 'Aerospace and defense industry solutions',
        subcategories: [
          { name: 'Defense Technology', description: 'Advanced defense technology solutions' },
          { name: 'Aerospace Manufacturing', description: 'Aircraft and spacecraft manufacturing' },
          { name: 'Cybersecurity in Defense', description: 'Security solutions for defense sector' },
          { name: 'AI in Surveillance & Navigation', description: 'AI-powered surveillance and navigation systems' }
        ]
      },
      {
        name: 'Healthcare & Life Sciences',
        description: 'Medical and healthcare services',
        subcategories: [
          { name: 'Biotechnology', description: 'Biotech research and development' },
          { name: 'AI in Healthcare', description: 'Artificial intelligence in healthcare applications' },
          { name: 'Medical Devices & Equipment', description: 'Healthcare equipment and medical devices' },
          { name: 'Pharmaceuticals', description: 'Drug development and pharmaceutical manufacturing' },
          { name: 'Genomics & Precision Medicine', description: 'Genomic research and personalized medicine' },
          { name: 'Healthcare Services', description: 'Healthcare service delivery and management' },
          { name: 'Digital Health & Telemedicine', description: 'Digital health solutions and telemedicine' }
        ]
      },
      {
        name: 'Agriculture',
        description: 'Agricultural technology and farming solutions',
        subcategories: [
          { name: 'Smart Farming', description: 'Intelligent farming and precision agriculture' },
          { name: 'Digital Agriculture', description: 'Digital transformation in agriculture' },
          { name: 'Agri Drones & Robotics', description: 'Drones and robotics for agriculture' },
          { name: 'AI in Crop Management', description: 'AI-powered crop monitoring and management' },
          { name: 'Agri-biotech', description: 'Biotechnology applications in agriculture' }
        ]
      },
      {
        name: 'Information, Communication & Technologies (ICT)',
        description: 'Information and communication technology solutions',
        subcategories: [
          { name: 'Artificial Intelligence', description: 'AI technologies and applications' },
          { name: 'AI in Education', description: 'AI applications in educational sector' },
          { name: 'Cybersecurity', description: 'Cybersecurity solutions and services' },
          { name: 'IoT & Cloud Computing', description: 'Internet of Things and cloud computing' },
          { name: 'Data Analytics', description: 'Data analysis and business intelligence' },
          { name: 'Telecom & Networking', description: 'Telecommunications and networking solutions' }
        ]
      },
      {
        name: 'Automotive, Logistics & Transportation',
        description: 'Transportation and logistics solutions',
        subcategories: [
          { name: 'Electric Vehicles (EVs)', description: 'Electric vehicle technology and infrastructure' },
          { name: 'Autonomous Vehicles', description: 'Self-driving vehicle technology' },
          { name: 'Smart Logistics', description: 'Intelligent logistics and supply chain solutions' },
          { name: 'AI in Mobility', description: 'AI applications in transportation and mobility' },
          { name: 'Automotive Electronics', description: 'Electronic systems for automotive industry' },
          { name: 'Telematics & Fleet Management', description: 'Vehicle telematics and fleet management' }
        ]
      },
      {
        name: 'Industrial, Manufacturing & Construction',
        description: 'Industrial manufacturing and construction solutions',
        subcategories: [
          { name: 'Industry 4.0', description: 'Fourth industrial revolution technologies' },
          { name: 'Smart Factories', description: 'Intelligent manufacturing and smart factories' },
          { name: 'Industrial Automation', description: 'Automation solutions for industrial processes' },
          { name: 'Construction Technology', description: 'Technology solutions for construction industry' },
          { name: 'Sustainable Infrastructure', description: 'Sustainable and green infrastructure development' }
        ]
      },
      {
        name: 'BFSI',
        description: 'Banking, Financial Services and Insurance',
        subcategories: [
          { name: 'FinTech & Digital Banking', description: 'Financial technology and digital banking solutions' },
          { name: 'AI in Financial Services', description: 'AI applications in financial services' },
          { name: 'Cybersecurity in BFSI', description: 'Cybersecurity for banking and financial services' },
          { name: 'Blockchain & Digital Payments', description: 'Blockchain technology and digital payment systems' },
          { name: 'RegTech & InsurTech', description: 'Regulatory technology and insurance technology' }
        ]
      },
      {
        name: 'Semiconductor & Electronics',
        description: 'Semiconductor and electronics industry',
        subcategories: [
          { name: 'Semiconductor Manufacturing', description: 'Semiconductor fabrication and manufacturing' },
          { name: 'Chip Design & Fabrication', description: 'Microchip design and fabrication processes' },
          { name: 'AI Chips & Edge Computing', description: 'AI-specific chips and edge computing solutions' },
          { name: 'Electronics & Systems Components', description: 'Electronic components and system integration' },
          { name: 'Consumer Electronics', description: 'Consumer electronic devices and products' }
        ]
      },
      {
        name: 'Chemicals & Materials',
        description: 'Chemical and materials industry',
        subcategories: [
          { name: 'Specialty Chemicals', description: 'Specialty chemical products and solutions' },
          { name: 'Advanced Materials', description: 'Advanced materials and composites' },
          { name: 'Green Materials', description: 'Sustainable and eco-friendly materials' },
          { name: 'Nanomaterials', description: 'Nanotechnology and nanomaterials' },
          { name: 'Bioplastics', description: 'Biodegradable and bio-based plastics' }
        ]
      },
      {
        name: 'Consumer Goods and Services',
        description: 'Consumer goods and services industry',
        subcategories: [
          { name: 'Sports & Fitness Technology', description: 'Technology for sports and fitness industry' },
          { name: 'Smart Home Devices', description: 'Smart home automation and IoT devices' },
          { name: 'AI in Retail', description: 'AI applications in retail and e-commerce' },
          { name: 'Digital Entertainment', description: 'Digital entertainment and media solutions' },
          { name: 'Personal Care & Wellness', description: 'Personal care and wellness products' },
          { name: 'Food and Beverage', description: 'Food and beverage industry solutions' }
        ]
      },
      {
        name: 'Environment, Energy & Power',
        description: 'Environmental, energy and power solutions',
        subcategories: [
          { name: 'Green, Alternative, and Renewable Energy', description: 'Renewable and sustainable energy solutions' },
          { name: 'Non-renewable and Conventional Energy', description: 'Traditional energy sources and technologies' },
          { name: 'Smart Grids & Energy Storage', description: 'Smart grid technology and energy storage systems' },
          { name: 'Waste Management', description: 'Waste management and recycling solutions' },
          { name: 'Environmental Monitoring', description: 'Environmental monitoring and assessment' },
          { name: 'Carbon Capture & Sustainability', description: 'Carbon capture technology and sustainability initiatives' }
        ]
      }
    ]
    
    const createdCategories = await Promise.all(
      seedCategories.map((cat, index) => {
        // Helper function to generate slug
        const generateSlug = (name) => {
          return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        }
        
        const category = new Category({
          name: cat.name,
          slug: generateSlug(cat.name),
          description: cat.description,
          sortOrder: index,
          subcategories: cat.subcategories.map((sub, subIndex) => ({
            name: sub.name,
            slug: generateSlug(sub.name),
            description: sub.description,
            sortOrder: subIndex
          }))
        })
        return category.save()
      })
    )
    
    res.status(201).json({
      success: true,
      data: createdCategories,
      message: `${createdCategories.length} categories seeded successfully`
    })
  } catch (error) {
    console.error('Error seeding categories:', error)
    next(error)
  }
})


export default router
