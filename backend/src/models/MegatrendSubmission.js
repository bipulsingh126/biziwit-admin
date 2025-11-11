import mongoose from 'mongoose'

const MegatrendSubmissionSchema = new mongoose.Schema({
  megatrendId: { type: String, required: true, index: true },
  megatrendTitle: { type: String, required: true },
  slug: { type: String, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  company: { type: String, required: true },
  role: { type: String, required: true },
  agreed: { type: Boolean, default: false },
}, { timestamps: true })

// Pre-save middleware to generate slug
MegatrendSubmissionSchema.pre('save', function(next) {
  if (!this.slug) {
    const timestamp = Date.now().toString().slice(-6)
    let baseSlug = `submission-${timestamp}`
    
    if (this.name) {
      const nameSlug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-')
      baseSlug = `${baseSlug}-${nameSlug}`
    }
    
    this.slug = baseSlug
  }
  next()
})

export default mongoose.model('MegatrendSubmission', MegatrendSubmissionSchema)
