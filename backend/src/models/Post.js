import mongoose from 'mongoose'

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, trim: true },
})

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  type: { type: String, enum: ['blog', 'news'], default: 'blog', index: true },
  excerpt: { type: String, trim: true },
  content: { type: String }, // HTML or rich text JSON string
  coverImage: {
    type: ImageSchema,
    default: null
  },
  images: {
    type: [ImageSchema],
    default: []
  },
  tags: [{ type: String, trim: true, lowercase: true, index: true }],
  // SEO
  metaTitle: { type: String, trim: true },
  metaDescription: { type: String, trim: true },
  metaKeywords: [{ type: String, trim: true, lowercase: true }],
  // Publishing
  status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  publishedAt: { type: Date },
  author: { type: String, trim: true },
}, { timestamps: true })

// Pre-save middleware to generate slug
PostSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
  }
  next()
})

// Full-text search index
PostSchema.index({ title: 'text', excerpt: 'text', content: 'text', tags: 'text' })

export default mongoose.model('Post', PostSchema)
