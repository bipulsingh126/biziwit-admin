import mongoose from 'mongoose'

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, trim: true },
}, { _id: false })

const ReportSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  summary: { type: String, trim: true },
  content: { type: String }, // HTML or rich text JSON string
  coverImage: ImageSchema,
  images: [ImageSchema],
  category: { type: String, trim: true },
  tags: [{ type: String, trim: true, lowercase: true }],
  featured: { type: Boolean, default: false },
  popular: { type: Boolean, default: false },
  // SEO
  metaTitle: { type: String, trim: true },
  metaDescription: { type: String, trim: true },
  // Publishing
  status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  publishedAt: { type: Date },
  author: { type: String, trim: true },
}, { timestamps: true })

export default mongoose.model('Report', ReportSchema)
