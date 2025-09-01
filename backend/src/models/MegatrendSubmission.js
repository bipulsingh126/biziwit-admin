import mongoose from 'mongoose'

const MegatrendSubmissionSchema = new mongoose.Schema({
  megatrendId: { type: Number, required: true },
  megatrendTitle: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  company: { type: String, required: true },
  role: { type: String, required: true },
  agreed: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model('MegatrendSubmission', MegatrendSubmissionSchema)
