import mongoose from 'mongoose'

const CustomReportRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  company: { type: String, required: true },
  industry: { type: String, required: true },
  requirements: { type: String, required: true },
  deadline: { type: String },
  status: { type: String, enum: ['new','in_progress','awaiting_customer','completed'], default: 'new', index: true },
  notes: { type: String },
}, { timestamps: true })

export default mongoose.model('CustomReportRequest', CustomReportRequestSchema)
