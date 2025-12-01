import mongoose from 'mongoose'

// Helper function to generate slug from text
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-') // Remove leading/trailing hyphens
}

// Banner Schema with slug
const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, { _id: true })

// Megatrend Schema with slug
const megatrendSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, { _id: true })

// Main HomePage Schema
const homePageSchema = new mongoose.Schema({
  pageTitle: {
    type: String,
    required: true,
    default: 'BiziWit - Market Research & Business Intelligence'
  },
  pageSubtitle: {
    type: String,
    required: true,
    default: 'Comprehensive market research reports and industry analysis'
  },
  slug: {
    type: String,
    unique: true,
    default: 'homepage'
  },
  banners: [bannerSchema],
  megatrends: [megatrendSchema],
  seoData: {
    title: {
      type: String,
      default: 'BiziWit - Market Research & Business Intelligence'
    },
    metaDescription: {
      type: String,
      default: 'Leading provider of market research reports, industry analysis, and business intelligence solutions.'
    },
    keywords: {
      type: String,
      default: 'market research, business intelligence, industry analysis, reports'
    },
    author: {
      type: String,
      default: 'Bizwit Research'
    },
    publisher: {
      type: String,
      default: 'Bizwit Research & Consulting LLP'
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

// Indexes for better performance
// Note: slug indexes are automatically created by unique: true constraints
homePageSchema.index({ isActive: 1 })

// Text search index
homePageSchema.index({
  pageTitle: 'text',
  pageSubtitle: 'text',
  'banners.title': 'text',
  'megatrends.heading': 'text',
  'megatrends.title': 'text'
})

// Virtual for active banners
homePageSchema.virtual('activeBanners').get(function () {
  return this.banners.filter(banner => banner.isActive)
})

// Virtual for active megatrends
homePageSchema.virtual('activeMegatrends').get(function () {
  return this.megatrends.filter(megatrend => megatrend.isActive)
})

// Pre-save middleware to generate slugs
homePageSchema.pre('save', function (next) {
  // Generate banner slugs
  this.banners.forEach(banner => {
    if (!banner.slug || banner.isModified('title')) {
      banner.slug = generateSlug(banner.title)
    }
  })

  // Generate megatrend slugs
  this.megatrends.forEach(megatrend => {
    if (!megatrend.slug || megatrend.isModified('heading')) {
      megatrend.slug = generateSlug(megatrend.heading)
    }
  })

  next()
})

// Instance methods for banner management
homePageSchema.methods.addBanner = function (bannerData) {
  const slug = generateSlug(bannerData.title)
  const banner = {
    ...bannerData,
    slug,
    sortOrder: this.banners.length
  }
  this.banners.push(banner)
  return banner
}

homePageSchema.methods.updateBannerBySlug = function (slug, updateData) {
  const banner = this.banners.find(b => b.slug === slug)
  if (banner) {
    Object.assign(banner, updateData)
    if (updateData.title) {
      banner.slug = generateSlug(updateData.title)
    }
    return banner
  }
  return null
}

homePageSchema.methods.removeBannerBySlug = function (slug) {
  const index = this.banners.findIndex(b => b.slug === slug)
  if (index > -1) {
    return this.banners.splice(index, 1)[0]
  }
  return null
}

// Instance methods for megatrend management
homePageSchema.methods.addMegatrend = function (megatrendData) {
  const slug = generateSlug(megatrendData.heading)
  const megatrend = {
    ...megatrendData,
    slug,
    sortOrder: this.megatrends.length
  }
  this.megatrends.push(megatrend)
  return megatrend
}

homePageSchema.methods.updateMegatrendBySlug = function (slug, updateData) {
  const megatrend = this.megatrends.find(m => m.slug === slug)
  if (megatrend) {
    Object.assign(megatrend, updateData)
    if (updateData.heading) {
      megatrend.slug = generateSlug(updateData.heading)
    }
    return megatrend
  }
  return null
}

homePageSchema.methods.removeMegatrendBySlug = function (slug) {
  const index = this.megatrends.findIndex(m => m.slug === slug)
  if (index > -1) {
    return this.megatrends.splice(index, 1)[0]
  }
  return null
}

// Static method to create default homepage data
homePageSchema.statics.createDefault = async function () {
  const defaultData = {
    pageTitle: 'BiziWit - Market Research & Business Intelligence',
    pageSubtitle: 'Comprehensive market research reports and industry analysis',
    banners: [
      {
        title: 'Market Research Reports',
        slug: 'market-research-reports',
        isActive: true,
        sortOrder: 0
      },
      {
        title: 'Industry Analysis',
        slug: 'industry-analysis',
        isActive: true,
        sortOrder: 1
      },
      {
        title: 'Business Intelligence',
        slug: 'business-intelligence',
        isActive: true,
        sortOrder: 2
      },
      {
        title: 'Custom Research',
        slug: 'custom-research',
        isActive: true,
        sortOrder: 3
      }
    ],
    megatrends: [
      {
        heading: 'Future Technology',
        title: 'AI & Machine Learning Trends',
        slug: 'future-technology-ai-ml',
        isActive: true,
        sortOrder: 0
      },
      {
        heading: 'Digital Transformation',
        title: 'Industry 4.0 Revolution',
        slug: 'digital-transformation-industry-4',
        isActive: true,
        sortOrder: 1
      },
      {
        heading: 'Sustainability',
        title: 'Green Technology Solutions',
        slug: 'sustainability-green-tech',
        isActive: true,
        sortOrder: 2
      }
    ]
  }

  return await this.create(defaultData)
}

const HomePage = mongoose.model('HomePage', homePageSchema)

export default HomePage
