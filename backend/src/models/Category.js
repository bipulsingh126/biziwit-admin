import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },

  subcategories: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    isTopTrending: {
      type: Boolean,
      default: false,
      index: true
    }
  }]
}, {
  timestamps: true
})

// Create compound index for subcategory slugs within a category
categorySchema.index({ 'subcategories.slug': 1, slug: 1 })

// Text index for search
categorySchema.index({
  name: 'text',
  description: 'text',
  'subcategories.name': 'text',
  'subcategories.description': 'text'
})

// Pre-save middleware to generate slugs
categorySchema.pre('save', function(next) {
  // Generate slug for category if not present
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  
  // Generate slugs for subcategories
  this.subcategories.forEach(sub => {
    if (!sub.slug && sub.name) {
      sub.slug = sub.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }
  })
  
  next()
})

export default mongoose.model('Category', categorySchema)
