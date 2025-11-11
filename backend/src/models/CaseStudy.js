import mongoose from 'mongoose'

const caseStudySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subTitle: {
    type: String,
    trim: true,
    maxlength: 300
  },
  authorName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  mainImage: {
    type: String,
    trim: true
  },
  homePageVisibility: {
    type: Boolean,
    default: false
  },
  titleTag: {
    type: String,
    trim: true,
    maxlength: 60
  },
  slug: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness for non-null values
  },
  url: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: 160
  },
  keywords: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  readingTime: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Indexes for better query performance
caseStudySchema.index({ title: 'text', content: 'text', keywords: 'text' })
caseStudySchema.index({ status: 1 })
caseStudySchema.index({ publishDate: -1 })
caseStudySchema.index({ authorName: 1 })
caseStudySchema.index({ homePageVisibility: 1 })
// Note: slug index is automatically created by unique: true constraint

// Virtual for excerpt
caseStudySchema.virtual('excerpt').get(function() {
  if (!this.content) return ''
  const plainText = this.content.replace(/<[^>]*>/g, '')
  return plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText
})

// Calculate reading time before saving
caseStudySchema.pre('save', function(next) {
  if (this.content) {
    const plainText = this.content.replace(/<[^>]*>/g, '')
    const wordsPerMinute = 200
    const wordCount = plainText.split(/\s+/).length
    this.readingTime = Math.ceil(wordCount / wordsPerMinute)
  }
  next()
})

// Helper function to generate slug
caseStudySchema.methods.generateSlug = function(baseTitle) {
  return baseTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Pre-save middleware to generate slug and URL if not provided
caseStudySchema.pre('save', async function(next) {
  // Generate slug if not provided or if title changed
  if (!this.slug || (this.isModified('title') && this.title)) {
    let baseSlug = this.generateSlug(this.title);
    let slug = baseSlug;
    let counter = 1;
    
    // Check for existing slugs and make unique
    while (await this.constructor.findOne({ slug: slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  
  // Generate URL from slug if not provided
  if (!this.url && this.slug) {
    this.url = this.slug;
  }
  
  next();
});

export default mongoose.model('CaseStudy', caseStudySchema)
