import mongoose from 'mongoose'

const caseStudySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subTitle: {
    type: String,
    trim: true,
    maxlength: 300
  },
  authorName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  mainImage: {
    type: String,
    trim: true
  },
  homePageVisibility: {
    type: Boolean,
    default: false
  },
  titleTag: {
    type: String,
    trim: true,
    maxlength: 60
  },
  url: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true
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
  content: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  readingTime: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Indexes for better query performance
caseStudySchema.index({ title: 'text', content: 'text', keywords: 'text' })
caseStudySchema.index({ status: 1 })
caseStudySchema.index({ publishDate: -1 })
caseStudySchema.index({ authorName: 1 })
caseStudySchema.index({ homePageVisibility: 1 })

// Virtual for excerpt
caseStudySchema.virtual('excerpt').get(function() {
  if (!this.content) return ''
  const plainText = this.content.replace(/<[^>]*>/g, '')
  return plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText
})

// Calculate reading time before saving
caseStudySchema.pre('save', function(next) {
  if (this.content) {
    const plainText = this.content.replace(/<[^>]*>/g, '')
    const wordsPerMinute = 200
    const wordCount = plainText.split(/\s+/).length
    this.readingTime = Math.ceil(wordCount / wordsPerMinute)
  }
  next()
})

// Auto-generate URL slug from title if not provided
caseStudySchema.pre('save', function(next) {
  if (!this.url && this.title) {
    this.url = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
  }
  next()
})

export default mongoose.model('CaseStudy', caseStudySchema)
