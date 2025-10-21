import mongoose from 'mongoose'

const SEOPageSchema = new mongoose.Schema({
  // Core SEO fields
  pageName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  titleMetaTag: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 60
  },
  url: { 
    type: String, 
    required: true, 
    trim: true, 
    unique: true 
  },
  featuredImage: { 
    type: String, 
    trim: true 
  },
  metaDescription: { 
    type: String, 
    trim: true,
    maxlength: 160
  },
  keywords: { 
    type: String, 
    trim: true 
  },
  
  // Additional SEO fields
  metaKeywords: [{
    type: String,
    trim: true
  }],
  canonicalUrl: { 
    type: String, 
    trim: true 
  },
  
  // Open Graph fields
  ogTitle: { 
    type: String, 
    trim: true 
  },
  ogDescription: { 
    type: String, 
    trim: true 
  },
  ogImage: { 
    type: String, 
    trim: true 
  },
  
  // Twitter fields
  twitterTitle: { 
    type: String, 
    trim: true 
  },
  twitterDescription: { 
    type: String, 
    trim: true 
  },
  twitterImage: { 
    type: String, 
    trim: true 
  },
  
  // Schema markup type
  schemaType: { 
    type: String, 
    enum: ['WebPage', 'Article', 'BlogPosting', 'Product', 'Service'], 
    default: 'WebPage' 
  },
  
  // Robot directives
  noIndex: { 
    type: Boolean, 
    default: false 
  },
  noFollow: { 
    type: Boolean, 
    default: false 
  },
  
  // Status and management
  isActive: { 
    type: Boolean, 
    default: true 
  },
  priority: { 
    type: Number, 
    default: 0.5, 
    min: 0, 
    max: 1 
  },
  changeFrequency: { 
    type: String, 
    enum: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'], 
    default: 'weekly' 
  },
  
  // Analytics and crawling
  lastCrawled: { 
    type: Date 
  },
  crawlStatus: { 
    type: String, 
    enum: ['pending', 'success', 'error'], 
    default: 'pending' 
  },
  crawlErrors: [{
    type: String,
    trim: true
  }],
  
  // Performance metrics
  pageLoadTime: { 
    type: Number 
  },
  mobileUsability: { 
    type: Boolean, 
    default: true 
  },
  sslSecure: { 
    type: Boolean, 
    default: true 
  },
  
  // Content analysis
  contentLength: { 
    type: Number 
  },
  headingsCount: { 
    type: Number 
  },
  imagesCount: { 
    type: Number 
  },
  linksCount: { 
    type: Number 
  },
  
  // SEO scores
  seoScore: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  performanceScore: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  accessibilityScore: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  
  // Audit information
  lastAuditDate: { 
    type: Date 
  },
  auditedBy: { 
    type: String, 
    trim: true 
  },
  auditNotes: { 
    type: String, 
    trim: true 
  }
}, { 
  timestamps: true,
  collection: 'seopages'
})

// Indexes for better query performance
SEOPageSchema.index({ pageName: 'text', titleMetaTag: 'text', metaDescription: 'text', keywords: 'text' })
// Note: url index is automatically created by unique: true constraint
SEOPageSchema.index({ isActive: 1 })
SEOPageSchema.index({ seoScore: -1 })

// Virtual for formatted keywords
SEOPageSchema.virtual('keywordsArray').get(function() {
  return this.keywords ? this.keywords.split(',').map(k => k.trim()).filter(Boolean) : []
})

// Method to calculate SEO score
SEOPageSchema.methods.calculateSEOScore = function() {
  let score = 0
  
  // Title length (30-60 characters is optimal)
  if (this.titleMetaTag && this.titleMetaTag.length >= 30 && this.titleMetaTag.length <= 60) {
    score += 20
  }
  
  // Meta description length (120-160 characters is optimal)
  if (this.metaDescription && this.metaDescription.length >= 120 && this.metaDescription.length <= 160) {
    score += 20
  }
  
  // Has keywords
  if (this.keywords && this.keywords.length > 0) {
    score += 15
  }
  
  // Has featured image
  if (this.featuredImage) {
    score += 10
  }
  
  // URL is SEO friendly (no special characters, uses hyphens)
  if (this.url && /^\/[a-z0-9\-\/]*$/.test(this.url)) {
    score += 10
  }
  
  // Has canonical URL
  if (this.canonicalUrl) {
    score += 10
  }
  
  // SSL secure
  if (this.sslSecure) {
    score += 5
  }
  
  // Mobile usability
  if (this.mobileUsability) {
    score += 5
  }
  
  // Not blocked by robots
  if (!this.noIndex && !this.noFollow) {
    score += 5
  }
  
  this.seoScore = Math.min(score, 100) // Cap at 100
  return this.seoScore
}

// Pre-save middleware to calculate SEO score
SEOPageSchema.pre('save', function(next) {
  try {
    this.calculateSEOScore()
    next()
  } catch (error) {
    next(error)
  }
})

// Ensure virtual fields are serialized
SEOPageSchema.set('toJSON', { virtuals: true })
SEOPageSchema.set('toObject', { virtuals: true })

export default mongoose.model('SEOPage', SEOPageSchema)
