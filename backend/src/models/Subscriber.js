import mongoose from 'mongoose'

const SubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  slug: { type: String, unique: true, lowercase: true, trim: true },
  name: { type: String, trim: true },
  source: { type: String, trim: true },
  status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed', index: true },
  meta: { type: Object },
}, { timestamps: true })

// Pre-save middleware to generate slug
SubscriberSchema.pre('save', function(next) {
  if (!this.slug) {
    const timestamp = Date.now().toString().slice(-6)
    const emailPrefix = this.email.split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
    
    this.slug = `subscriber-${emailPrefix}-${timestamp}`
  }
  next()
})

export default mongoose.model('Subscriber', SubscriberSchema)
