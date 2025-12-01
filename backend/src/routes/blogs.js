import express from 'express';
import Blog from '../models/Blog.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import XLSX from 'xlsx';
import {
  blogUpload,
  handleImageUploadResponse,
  handleUploadError,
  deleteImageFile,
  generateImageUrl
} from '../utils/imageUpload.js';

const router = express.Router();

// Get all blogs with pagination, search, and filters
router.get('/', async (req, res) => {
  try {
    const {
      q = '',
      slug = '',
      limit = 10,
      offset = 0,
      status = '',
      author = '',
      dateRange = ''
    } = req.query;

    // Build search query
    let searchQuery = {};

    // For public access (non-authenticated), only show published blogs
    // Check if user is authenticated by looking for authorization header
    const isAuthenticated = req.headers.authorization;
    if (!isAuthenticated && !status) {
      // If not authenticated and no specific status filter, only show published
      searchQuery.status = 'published';
    }

    // Text search
    if (q.trim()) {
      searchQuery.$or = [
        { title: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { authorName: { $regex: q, $options: 'i' } },
        { keywords: { $regex: q, $options: 'i' } }
      ];
    }

    // Slug filter
    if (slug.trim()) {
      searchQuery.slug = { $regex: slug, $options: 'i' };
    }

    // Status filter (overrides default published filter if specified)
    if (status) {
      searchQuery.status = status;
    }

    // Author filter
    if (author.trim()) {
      searchQuery.authorName = { $regex: author, $options: 'i' };
    }

    // Date range filter
    if (dateRange) {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      if (startDate) {
        searchQuery.createdAt = { $gte: startDate };
      }
    }

    // Get total count
    const total = await Blog.countDocuments(searchQuery);

    // Get blogs with pagination
    const blogs = await Blog.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    res.json({
      success: true,
      data: blogs,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs',
      error: error.message
    });
  }
});

// Get single blog by slug (public access)
router.get('/by-slug/:slug', async (req, res) => {
  try {
    // Only return published blogs for public access
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: 'published'
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog',
      error: error.message
    });
  }
});

// Public blog access by slug (SEO-friendly URL)
router.get('/slug/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: 'published' // Only show published blogs for public access
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment view count for public access
    await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });

    res.json({
      success: true,
      blog: blog
    });
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog',
      error: error.message
    });
  }
});

// Get blog statistics (MUST be before /:identifier route)
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments();
    const publishedBlogs = await Blog.countDocuments({ status: 'published' });
    const draftBlogs = await Blog.countDocuments({ status: 'draft' });
    const scheduledBlogs = await Blog.countDocuments({ status: 'scheduled' });

    const totalViews = await Blog.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    const topAuthors = await Blog.aggregate([
      { $group: { _id: '$authorName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        scheduledBlogs,
        totalViews: totalViews[0]?.totalViews || 0,
        topAuthors
      }
    });
  } catch (error) {
    console.error('Error fetching blog statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog statistics',
      error: error.message
    });
  }
});

// Utility route to populate slugs for existing blogs (MUST be before /:identifier route)
router.post('/utils/populate-slugs', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const updatedCount = await Blog.populateSlugs();

    res.json({
      success: true,
      message: `Successfully populated slugs for ${updatedCount} blogs`,
      updatedCount
    });
  } catch (error) {
    console.error('Error populating blog slugs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to populate blog slugs',
      error: error.message
    });
  }
});

// Get single blog by slug or ID (with slug priority) - MUST be after specific routes
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    // Try to find by slug first, then by ID for backward compatibility
    let blog = await Blog.findOne({ slug: identifier });

    if (!blog && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // If it looks like a MongoDB ObjectId, try finding by ID
      blog = await Blog.findById(identifier);
    }

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog',
      error: error.message
    });
  }
});

// Create new blog
router.post('/', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const blogData = {
      ...req.body,
      createdBy: req.user.id
    };

    const blog = new Blog(blogData);
    await blog.save();

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog
    });
  } catch (error) {
    console.error('Error creating blog:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A blog with this URL already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create blog',
      error: error.message
    });
  }
});

// Update blog by slug
router.put('/by-slug/:slug', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    });
  } catch (error) {
    console.error('Error updating blog:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A blog with this slug or URL already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update blog',
      error: error.message
    });
  }
});

// Update blog by ID (legacy support)
router.put('/:id', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by slug first, then by ID
    let blog = await Blog.findOne({ slug: id });

    if (!blog && id.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(id);
    }

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Update the blog
    Object.assign(blog, req.body);
    blog.updatedAt = new Date();
    await blog.save();

    res.json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    });
  } catch (error) {
    console.error('Error updating blog:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A blog with this slug or URL already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update blog',
      error: error.message
    });
  }
});

// Delete blog by slug
router.delete('/by-slug/:slug', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const blog = await Blog.findOneAndDelete({ slug: req.params.slug });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Delete associated image file if exists
    if (blog.mainImage && !blog.mainImage.startsWith('http')) {
      const filename = blog.mainImage.split('/').pop();
      deleteImageFile('blogs', filename);
    }

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog',
      error: error.message
    });
  }
});

// Delete blog by ID (legacy support)
router.delete('/:id', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by slug first, then by ID
    let blog = await Blog.findOne({ slug: id });

    if (!blog && id.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(id);
    }

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Delete the blog
    await Blog.findByIdAndDelete(blog._id);

    // Delete associated image file if exists
    if (blog.mainImage && !blog.mainImage.startsWith('http')) {
      const filename = blog.mainImage.split('/').pop();
      deleteImageFile('blogs', filename);
    }

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog',
      error: error.message
    });
  }
});

// Upload blog cover image by slug
router.post('/by-slug/:slug/cover', authenticate, requireRole('super_admin', 'admin', 'editor'), blogUpload.single('file'), async (req, res) => {
  try {
    console.log('🚀 Starting blog cover image upload for slug:', req.params.slug)

    const blog = await Blog.findOne({ slug: req.params.slug })
    if (!blog) {
      console.log('❌ Blog not found')
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      })
    }

    // Delete old image if exists
    if (blog.mainImage) {
      const oldFilename = blog.mainImage.split('/').pop();
      deleteImageFile('blogs', oldFilename);
    }

    // Generate new image URL
    const imageUrl = generateImageUrl('blogs', req.file.filename);

    // Update mainImage in database
    blog.mainImage = imageUrl;
    await blog.save();

    console.log('💾 Updated blog with image URL:', imageUrl)
    console.log('✅ Image upload completed successfully')

    // Use centralized response handler
    handleImageUploadResponse(req, res, 'blogs');
  } catch (error) {
    console.error('❌ Error uploading blog image:', error)

    // Clean up uploaded file if database save fails
    if (req.file) {
      deleteImageFile('blogs', req.file.filename);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
      details: error.message
    })
  }
});

// Export blogs to CSV/Excel
router.get('/export/:format', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { format } = req.params;

    if (!['csv', 'excel'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid export format. Use csv or excel.'
      });
    }

    const blogs = await Blog.find({}).sort({ createdAt: -1 }).lean();

    // Prepare data for export
    const exportData = blogs.map(blog => ({
      'Blog Title': blog.title || '',
      'Sub Title': blog.subTitle || '',
      'Slug': blog.slug || '',
      'Author Name': blog.authorName || '',
      'Publish Date': blog.publishDate ? new Date(blog.publishDate).toLocaleDateString() : '',
      'Status': blog.status || '',
      'Title Tag': blog.titleTag || '',
      'URL': blog.url || '',
      'Meta Description': blog.metaDescription || '',
      'Keywords': blog.keywords || '',
      'Views': blog.views || 0,
      'Featured': blog.featured ? 'Yes' : 'No',
      'Created Date': blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : '',
      'Updated Date': blog.updatedAt ? new Date(blog.updatedAt).toLocaleDateString() : ''
    }));

    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row =>
          headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=blogs-export-${Date.now()}.csv`);
      res.send(csvContent);
    } else {
      // Generate Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 30 }, // Blog Title
        { wch: 25 }, // Sub Title
        { wch: 25 }, // Slug
        { wch: 20 }, // Author Name
        { wch: 15 }, // Publish Date
        { wch: 12 }, // Status
        { wch: 25 }, // Title Tag
        { wch: 30 }, // URL
        { wch: 40 }, // Meta Description
        { wch: 30 }, // Keywords
        { wch: 10 }, // Views
        { wch: 10 }, // Featured
        { wch: 15 }, // Created Date
        { wch: 15 }  // Updated Date
      ];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Blogs');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=blogs-export-${Date.now()}.xlsx`);
      res.send(excelBuffer);
    }
  } catch (error) {
    console.error('Error exporting blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export blogs',
      error: error.message
    });
  }
});

// Upload blog cover image by ID (legacy support)
router.post('/:id/cover', authenticate, requireRole('super_admin', 'admin', 'editor'), blogUpload.single('file'), async (req, res) => {
  try {
    console.log('🚀 Starting blog cover image upload for ID:', req.params.id)

    const { id } = req.params;

    // Try to find by slug first, then by ID
    let blog = await Blog.findOne({ slug: id });

    if (!blog && id.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(id);
    }

    if (!blog) {
      console.log('❌ Blog not found')
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      })
    }

    // Delete old image if exists
    if (blog.mainImage) {
      const oldFilename = blog.mainImage.split('/').pop();
      deleteImageFile('blogs', oldFilename);
    }

    // Generate new image URL
    const imageUrl = generateImageUrl('blogs', req.file.filename);

    // Update mainImage in database
    blog.mainImage = imageUrl;
    await blog.save();

    console.log('💾 Updated blog with image URL:', imageUrl)
    console.log('✅ Image upload completed successfully')

    // Use centralized response handler
    handleImageUploadResponse(req, res, 'blogs');
  } catch (error) {
    console.error('❌ Error uploading blog image:', error)

    // Clean up uploaded file if database save fails
    if (req.file) {
      deleteImageFile('blogs', req.file.filename);
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
    const blogs = await Blog.find({}).limit(5).select('title slug url _id');
    const totalBlogs = await Blog.countDocuments();

    res.json({
      success: true,
      message: 'Blog slug debug information',
      totalBlogs,
      sampleBlogs: blogs,
      testInstructions: {
        bySlug: '/api/blogs/by-slug/{slug}',
        byId: '/api/blogs/{id}',
        byIdentifier: '/api/blogs/{slug-or-id}'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
