import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
  // Basic required fields
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },

  // Content fields
  subTitle: {
    type: String,
    trim: true,
    default: ''
  },
  summary: {
    type: String,
    trim: true,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  tableOfContents: {
    type: String,
    default: ''
  },

  // SEO fields
  titleTag: {
    type: String,
    trim: true,
    default: ''
  },
  url: {
    type: String,
    trim: true,
    default: ''
  },
  metaDescription: {
    type: String,
    trim: true,
    default: ''
  },
  keywords: {
    type: String,
    trim: true,
    default: ''
  },

  // Categories
  category: {
    type: String,
    trim: true,
    default: ''
  },
  subCategory: {
    type: String,
    trim: true,
    default: ''
  },

  // Domain and Region fields
  domain: {
    type: String,
    trim: true,
    default: ''
  },
  subdomain: {
    type: String,
    trim: true,
    default: ''
  },
  region: {
    type: String,
    trim: true,
    default: ''
  },

  // Segmentation and Companies fields
  segment: {
    type: String,
    trim: true,
    default: ''
  },
  companies: {
    type: String,
    trim: true,
    default: ''
  },
  reportDescription: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Tags as simple string array
  tags: [String],

  // Images
  coverImage: {
    url: String,
    alt: String
  },
  images: [{
    url: String,
    alt: String,
    caption: String
  }],

  // Report Details
  reportCode: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  numberOfPages: {
    type: Number,
    min: 1,
    default: 1
  },
  publishDate: {
    type: Date,
    default: Date.now
  },

  // Report metadata
  reportDate: {
    type: Date,
    default: Date.now
  },
  reportCategories: {
    type: String,
    trim: true,
    default: ''
  },

  // Pricing fields
  excelDatapackPrice: {
    type: String,
    trim: true,
    default: ''
  },
  singleUserPrice: {
    type: String,
    trim: true,
    default: ''
  },
  enterprisePrice: {
    type: String,
    trim: true,
    default: ''
  },
  internetHandlingCharges: {
    type: String,
    trim: true,
    default: ''
  },

  // Homepage display
  trendingReportForHomePage: {
    type: Boolean,
    default: false
  },

  // Status and flags
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  popular: {
    type: Boolean,
    default: false
  },

  // SEO basic fields
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },

  // Publishing info
  author: {
    type: String,
    trim: true
  },
  publishedAt: Date,

  // Access control
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },

  // Report specific
  industry: {
    type: String,
    trim: true
  },
  reportType: {
    type: String,
    default: 'market-research'
  },
  price: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  format: {
    type: String,
    enum: ['pdf', 'html', 'docx'],
    default: 'pdf'
  },

  // License fields
  excelDataPackLicense: {
    type: String,
    default: ''
  },
  singleUserLicense: {
    type: String,
    default: ''
  },
  enterpriseLicensePrice: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
})

// Simple text index for search
reportSchema.index({
  title: 'text',
  summary: 'text',
  content: 'text'
})

// Basic indexes
reportSchema.index({ status: 1 })
reportSchema.index({ category: 1 })
reportSchema.index({ domain: 1 })
reportSchema.index({ region: 1 })
// Note: slug and reportCode indexes are automatically created by unique: true constraints
reportSchema.index({ trendingReportForHomePage: 1 })

// Auto-generate slug from title
reportSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Auto-generate report code if not provided
  if (this.isModified('title') && !this.reportCode) {
    const prefix = 'RPT'
    const timestamp = Date.now().toString().slice(-6)
    this.reportCode = `${prefix}${timestamp}`
  }

  next()
})

const Report = mongoose.model('Report', reportSchema)

export default Report