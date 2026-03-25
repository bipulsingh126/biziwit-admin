import mongoose from 'mongoose'

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, trim: true },
}, { _id: false })

const FileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  filename: { type: String, required: true },
  size: { type: Number },
  mime: { type: String }
}, { _id: false })

const MegatrendSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subTitle: { type: String, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  summary: { type: String, trim: true },
  content: { type: String }, // HTML or rich text JSON string
  heroImage: ImageSchema,
  images: [ImageSchema],
  whitepaper: FileSchema, // downloadable file info
  whitePaperUrl: { type: String, trim: true }, // External URL for white paper
  tags: [{ type: String, trim: true, lowercase: true, index: true }],
  titleTag: { type: String, trim: true },
  url: { type: String, trim: true },
  metaTitle: { type: String, trim: true },
  metaDescription: { type: String, trim: true },
  keywords: { type: String, trim: true },
  metaKeywords: [{ type: String, trim: true, lowercase: true }],
  category: { type: String, trim: true, index: true },
  subCategory: { type: String, trim: true },
  // Publishing
  status: { type: String, enum: ['draft', 'published', 'scheduled'], default: 'draft', index: true },
  publishedAt: { type: Date },
  isHome: { type: Boolean, default: false, index: true },
  isGtmStrategy: { type: Boolean, default: false, index: true },
  homePageVisibility: { type: Boolean, default: false },
  author: { type: String, trim: true },
}, { timestamps: true })

// Pre-save middleware to generate slug
MegatrendSchema.pre('save', function (next) {
  // Generate slug if it's empty or if title changed and slug wasn't manually set
  if (!this.slug || (this.isModified('title') && !this.isModified('slug') && !this.isModified('url'))) {
    if (this.url) {
      this.slug = this.url
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    } else if (this.title) {
      this.slug = this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    } else {
      this.slug = `megatrend-${Date.now()}`
    }
  }

  // Ensure url matches slug
  if (this.slug && !this.url) {
    this.url = this.slug
  } else if (this.url && !this.slug) {
    this.slug = this.url
  }

  // Sync isHome and homePageVisibility
  if (this.isModified('homePageVisibility')) {
    this.isHome = this.homePageVisibility
  } else if (this.isModified('isHome')) {
    this.homePageVisibility = this.isHome
  }

  // Sync metaTitle and titleTag
  if (this.isModified('titleTag') && !this.isModified('metaTitle')) {
    this.metaTitle = this.titleTag
  } else if (this.isModified('metaTitle') && !this.isModified('titleTag')) {
    this.titleTag = this.metaTitle
  }

  // Sync keywords and metaKeywords (if needed, though keywords is likely the main one now)
  if (this.isModified('keywords') && this.keywords) {
    this.metaKeywords = this.keywords.split(',').map(k => k.trim()).filter(Boolean)
  }
  next()
})

MegatrendSchema.index({ title: 'text', summary: 'text', content: 'text', tags: 'text' })

export default mongoose.model('Megatrend', MegatrendSchema)
