import express from 'express';
import Blog from '../models/Blog.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/blogs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all blogs with pagination, search, and filters
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      q = '',
      limit = 10,
      offset = 0,
      status = '',
      author = '',
      dateRange = ''
    } = req.query;

    // Build search query
    let searchQuery = {};

    // Text search
    if (q.trim()) {
      searchQuery.$or = [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { authorName: { $regex: q, $options: 'i' } },
        { keywords: { $regex: q, $options: 'i' } }
      ];
    }

    // Status filter
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

// Get single blog by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
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

// Update blog
router.put('/:id', authenticate, requireRole('super_admin', 'admin', 'editor'), async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
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
        message: 'A blog with this URL already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update blog',
      error: error.message
    });
  }
});

// Delete blog
router.delete('/:id', authenticate, requireRole('super_admin', 'admin'), async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Delete associated image file if exists
    if (blog.mainImage && !blog.mainImage.startsWith('http')) {
      const imagePath = path.join(__dirname, '../../', blog.mainImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
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

// Upload blog cover image
router.post('/:id/cover', authenticate, requireRole('super_admin', 'admin', 'editor'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Delete old image if exists
    if (blog.mainImage && !blog.mainImage.startsWith('http')) {
      const oldImagePath = path.join(__dirname, '../../', blog.mainImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update blog with new image path
    const imagePath = req.file.path.replace(/\\/g, '/');
    blog.mainImage = imagePath;
    await blog.save();

    res.json({
      success: true,
      message: 'Cover image uploaded successfully',
      data: {
        imagePath: imagePath,
        imageUrl: `${req.protocol}://${req.get('host')}/${imagePath}`
      }
    });
  } catch (error) {
    console.error('Error uploading cover image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload cover image',
      error: error.message
    });
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

// Get blog statistics
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

export default router;
