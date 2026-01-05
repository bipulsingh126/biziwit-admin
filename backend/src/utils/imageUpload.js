import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Centralized Image Upload Utility for bizwit Admin
 * Provides consistent image upload functionality across all components
 */

// Supported image types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  default: 5 * 1024 * 1024,    // 5MB default
  homepage: 10 * 1024 * 1024,  // 10MB for homepage banners
  reports: 2 * 1024 * 1024,    // 2MB for reports
  blogs: 5 * 1024 * 1024,      // 5MB for blogs
  'case-studies': 5 * 1024 * 1024, // 5MB for case studies
  'seo-pages': 2 * 1024 * 1024,    // 2MB for SEO pages
  'service-pages': 5 * 1024 * 1024 // 5MB for service pages
};

/**
 * Create multer storage configuration for specific component
 * @param {string} component - Component name (blogs, case-studies, homepage, etc.)
 * @param {string} subFolder - Optional subfolder within component directory
 * @returns {multer.StorageEngine}
 */
export const createStorage = (component, subFolder = '') => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      // Use both public/images and uploads directories for compatibility
      const publicDir = path.join(process.cwd(), 'public', 'images', component, subFolder);
      const uploadsDir = path.join(process.cwd(), 'uploads', component, subFolder);
      
      // Create directories if they don't exist
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Use public/images as primary storage for better static serving
      cb(null, publicDir);
    },
    filename: function (req, file, cb) {
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 10000);
      const extension = path.extname(file.originalname).toLowerCase();
      const filename = `${component}-${timestamp}-${randomNum}${extension}`;
      cb(null, filename);
    }
  });
};

/**
 * Create multer upload middleware for specific component
 * @param {string} component - Component name
 * @param {string} subFolder - Optional subfolder
 * @param {Object} options - Additional options
 * @returns {multer.Multer}
 */
export const createUploadMiddleware = (component, subFolder = '', options = {}) => {
  const storage = createStorage(component, subFolder);
  const fileSize = options.fileSize || FILE_SIZE_LIMITS[component] || FILE_SIZE_LIMITS.default;
  
  return multer({
    storage: storage,
    limits: {
      fileSize: fileSize,
      files: options.maxFiles || 1
    },
    fileFilter: (req, file, cb) => {
      console.log(`📸 Validating file upload for ${component}:`, {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      
      if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
      }
    }
  });
};

/**
 * Generate image URL for frontend consumption
 * @param {string} component - Component name
 * @param {string} filename - Image filename
 * @param {string} subFolder - Optional subfolder
 * @returns {string} - Image URL
 */
export const generateImageUrl = (component, filename, subFolder = '') => {
  const urlPath = subFolder 
    ? `/images/${component}/${subFolder}/${filename}`
    : `/images/${component}/${filename}`;
  return urlPath;
};

/**
 * Generate full image URL with domain
 * @param {string} component - Component name
 * @param {string} filename - Image filename
 * @param {string} subFolder - Optional subfolder
 * @param {Object} req - Express request object (optional)
 * @returns {string} - Full image URL
 */
export const generateFullImageUrl = (component, filename, subFolder = '', req = null) => {
  // Determine base URL based on environment and request
  let baseUrl;
  
  if (req) {
    // Use request headers to determine the correct domain
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
    const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:4000';
    baseUrl = `${protocol}://${host}`;
  } else {
    // Fallback to environment variables
    if (process.env.NODE_ENV === 'production') {
      baseUrl = process.env.API_BASE_URL || 'https://api.bizwitresearch.com';
    } else {
      baseUrl = process.env.BASE_URL || 'http://localhost:4000';
    }
  }
  
  const imagePath = generateImageUrl(component, filename, subFolder);
  return `${baseUrl}${imagePath}`;
};

/**
 * Delete image file from filesystem
 * @param {string} component - Component name
 * @param {string} filename - Image filename
 * @param {string} subFolder - Optional subfolder
 * @returns {boolean} - Success status
 */
export const deleteImageFile = (component, filename, subFolder = '') => {
  try {
    const publicPath = path.join(process.cwd(), 'public', 'images', component, subFolder, filename);
    const uploadsPath = path.join(process.cwd(), 'uploads', component, subFolder, filename);
    
    let deleted = false;
    
    // Delete from public/images directory
    if (fs.existsSync(publicPath)) {
      fs.unlinkSync(publicPath);
      console.log(`🗑️ Deleted image from public: ${publicPath}`);
      deleted = true;
    }
    
    // Delete from uploads directory (backup location)
    if (fs.existsSync(uploadsPath)) {
      fs.unlinkSync(uploadsPath);
      console.log(`🗑️ Deleted image from uploads: ${uploadsPath}`);
      deleted = true;
    }
    
    return deleted;
  } catch (error) {
    console.error(`❌ Error deleting image file:`, error);
    return false;
  }
};

/**
 * Validate image file exists
 * @param {string} component - Component name
 * @param {string} filename - Image filename
 * @param {string} subFolder - Optional subfolder
 * @returns {boolean} - File exists status
 */
export const validateImageExists = (component, filename, subFolder = '') => {
  const publicPath = path.join(process.cwd(), 'public', 'images', component, subFolder, filename);
  const uploadsPath = path.join(process.cwd(), 'uploads', component, subFolder, filename);
  
  return fs.existsSync(publicPath) || fs.existsSync(uploadsPath);
};

/**
 * Standard image upload response handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} component - Component name
 * @param {string} subFolder - Optional subfolder
 * @param {Object} additionalData - Additional data to include in response
 */
export const handleImageUploadResponse = (req, res, component, subFolder = '', additionalData = {}) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }
    
    const imageUrl = generateImageUrl(component, req.file.filename, subFolder);
    const fullUrl = generateFullImageUrl(component, req.file.filename, subFolder, req);
    
    // Verify file exists
    if (!validateImageExists(component, req.file.filename, subFolder)) {
      return res.status(500).json({ 
        success: false,
        error: 'File upload failed - file not saved' 
      });
    }
    
    console.log(`✅ Image upload successful for ${component}:`, {
      filename: req.file.filename,
      imageUrl,
      fullUrl,
      requestHost: req.get('host'),
      requestProtocol: req.protocol
    });
    
    res.json({ 
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: fullUrl, // Return full URL as primary imageUrl for deployment compatibility
      fullUrl,
      relativePath: imageUrl, // Keep relative path for backward compatibility
      fileInfo: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      ...additionalData
    });
  } catch (error) {
    console.error(`❌ Error in image upload response for ${component}:`, error);
    
    // Clean up uploaded file if response fails
    if (req.file) {
      deleteImageFile(component, req.file.filename, subFolder);
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to process image upload',
      details: error.message 
    });
  }
};

/**
 * Middleware to handle image upload errors
 */
export const handleUploadError = (error, req, res, next) => {
  console.error('❌ Image upload error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'The uploaded file exceeds the maximum allowed size'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        message: 'Maximum number of files exceeded'
      });
    }
  }
  
  res.status(400).json({
    success: false,
    error: 'Upload failed',
    message: error.message || 'An error occurred during file upload'
  });
};

// Pre-configured upload middlewares for common components
export const blogUpload = createUploadMiddleware('blogs');
export const caseStudyUpload = createUploadMiddleware('case-studies');
export const homepageUpload = createUploadMiddleware('homepage');
export const reportUpload = createUploadMiddleware('reports');
export const seoPageUpload = createUploadMiddleware('seo-pages');
export const servicePageUpload = createUploadMiddleware('service-pages');

// Export default configuration
export default {
  createStorage,
  createUploadMiddleware,
  generateImageUrl,
  generateFullImageUrl,
  deleteImageFile,
  validateImageExists,
  handleImageUploadResponse,
  handleUploadError,
  blogUpload,
  caseStudyUpload,
  homepageUpload,
  reportUpload,
  seoPageUpload,
  servicePageUpload
};
