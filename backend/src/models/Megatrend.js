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
  slug: { type: String, required: true, unique: true, lowercase: true },
  summary: { type: String, trim: true },
  content: { type: String }, // HTML or rich text JSON string
  heroImage: ImageSchema,
  images: [ImageSchema],
  whitepaper: FileSchema, // downloadable file info
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
MegatrendSchema.pre('save', function(next) {
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

MegatrendSchema.index({ title: 'text', summary: 'text', content: 'text', tags: 'text' })

export default mongoose.model('Megatrend', MegatrendSchema)
