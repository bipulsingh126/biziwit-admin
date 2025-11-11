import mongoose from 'mongoose'

const CustomReportRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, index: true },
  company: { type: String, required: true },
  industry: { type: String, required: true },
  requirements: { type: String, required: true },
  deadline: { type: String },
  status: { type: String, enum: ['new','in_progress','awaiting_customer','completed'], default: 'new', index: true },
  notes: { type: String },
}, { timestamps: true })

// Pre-save middleware to generate slug
CustomReportRequestSchema.pre('save', function(next) {
  if (!this.slug) {
    const timestamp = Date.now().toString().slice(-6)
    let baseSlug = `custom-report-${timestamp}`
    
    if (this.company) {
      const companySlug = this.company
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-')
      baseSlug = `${baseSlug}-${companySlug}`
    }
    
    this.slug = baseSlug
  }
  next()
})

export default mongoose.model('CustomReportRequest', CustomReportRequestSchema)
