import mongoose from 'mongoose'

const SubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
  name: { type: String, trim: true },
  source: { type: String, trim: true },
  status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed', index: true },
  meta: { type: Object },
}, { timestamps: true })

export default mongoose.model('Subscriber', SubscriberSchema)
