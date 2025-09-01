import mongoose from 'mongoose'

const InquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  company: { type: String, trim: true },
  subject: { type: String, trim: true },
  message: { type: String, required: true },
  source: { type: String, trim: true },
  status: { type: String, enum: ['new', 'in_progress', 'closed'], default: 'new', index: true },
  meta: { type: Object },
}, { timestamps: true })

export default mongoose.model('Inquiry', InquirySchema)
