import mongoose from 'mongoose'

const FeaturedSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  buttonText: {
    type: String,
    trim: true,
    default: ''
  },
  buttonLink: {
    type: String,
    trim: true,
    default: ''
  },
  layout: {
    type: String,
    enum: ['left', 'right'],
    default: 'right'
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true })

const HomePageSchema = new mongoose.Schema({
  pageTitle: {
    type: String,
    required: true,
    trim: true
  },
  pageSubtitle: {
    type: String,
    trim: true,
    default: ''
  },
  featuredSections: {
    type: [FeaturedSectionSchema],
    default: []
  },
  seoData: {
    title: {
      type: String,
      trim: true,
      default: 'Megatrends - BiziWit'
    },
    metaDescription: {
      type: String,
      trim: true,
      default: 'Explore the latest megatrends shaping the future of business and technology'
    },
    keywords: {
      type: String,
      trim: true,
      default: 'megatrends, business intelligence, market research, future trends'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Create text index for search functionality
HomePageSchema.index({
  pageTitle: 'text',
  pageSubtitle: 'text',
  'featuredSections.title': 'text',
  'featuredSections.description': 'text'
})

// Virtual for getting active featured sections
HomePageSchema.virtual('activeFeaturedSections').get(function() {
  return this.featuredSections
    .filter(section => section.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
})

// Method to add a new featured section
HomePageSchema.methods.addFeaturedSection = function(sectionData) {
  const maxOrder = this.featuredSections.reduce((max, section) => 
    Math.max(max, section.sortOrder || 0), 0
  )
  
  const newSection = {
    ...sectionData,
    sortOrder: maxOrder + 1
  }
  
  this.featuredSections.push(newSection)
  return this.featuredSections[this.featuredSections.length - 1]
}

// Method to update a featured section
HomePageSchema.methods.updateFeaturedSection = function(sectionId, updateData) {
  const section = this.featuredSections.id(sectionId)
  if (!section) {
    throw new Error('Featured section not found')
  }
  
  Object.assign(section, updateData)
  return section
}

// Method to remove a featured section
HomePageSchema.methods.removeFeaturedSection = function(sectionId) {
  const section = this.featuredSections.id(sectionId)
  if (!section) {
    throw new Error('Featured section not found')
  }
  
  section.remove()
  return true
}

// Method to reorder featured sections
HomePageSchema.methods.reorderFeaturedSections = function(sectionOrders) {
  sectionOrders.forEach(({ sectionId, sortOrder }) => {
    const section = this.featuredSections.id(sectionId)
    if (section) {
      section.sortOrder = sortOrder
    }
  })
}

const HomePage = mongoose.model('HomePage', HomePageSchema)
export default HomePage
