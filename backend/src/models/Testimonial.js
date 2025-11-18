import mongoose from 'mongoose'

const testimonialSchema = new mongoose.Schema({
  quote: {
    type: String,
    required: [true, 'Please provide a testimonial quote'],
    trim: true,
    maxlength: [1000, 'Quote cannot be more than 1000 characters']
  },
  clientName: {
    type: String,
    required: [true, 'Please provide client name'],
    trim: true,
    maxlength: [100, 'Client name cannot be more than 100 characters']
  },
  clientTitle: {
    type: String,
    required: [true, 'Please provide client title/position'],
    trim: true,
    maxlength: [100, 'Client title cannot be more than 100 characters']
  },
  clientCompany: {
    type: String,
    required: [true, 'Please provide client company'],
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  clientImage: {
    type: String,
    default: ''
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    index: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Text search index
testimonialSchema.index({ quote: 'text', clientName: 'text', clientCompany: 'text' })

// Update the updatedAt field before saving
testimonialSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

export default mongoose.model('Testimonial', testimonialSchema)
