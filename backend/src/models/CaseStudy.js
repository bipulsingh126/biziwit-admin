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
  category: {
    type: String,
    enum: [
      'Market Intelligence',
      'Competitive Intelligence',
      'Sustainability',
      'India Market Entry',
      'Voice of Customer',
      'Market Share Gain',
      'FTE',
      'Content Lead',
      'Home Page'
    ],
    required: true,
    default: 'Market Intelligence'
  },
  reportCategory: {
    type: String,
    trim: true,
    index: true
  },
  reportSubCategory: {
    type: String,
    trim: true
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

caseStudySchema.index({ homePageVisibility: 1 })
caseStudySchema.index({ category: 1 })
// Note: slug index is automatically created by unique: true constraint

// Virtual for excerpt
caseStudySchema.virtual('excerpt').get(function () {
  if (!this.content) return ''
  const plainText = this.content.replace(/<[^>]*>/g, '')
  return plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText
})

// Calculate reading time before saving
caseStudySchema.pre('save', function (next) {
  if (this.content) {
    const plainText = this.content.replace(/<[^>]*>/g, '')
    const wordsPerMinute = 200
    const wordCount = plainText.split(/\s+/).length
    this.readingTime = Math.ceil(wordCount / wordsPerMinute)
  }
  next()
})

// Helper function to generate slug
caseStudySchema.methods.generateSlug = function (baseTitle) {
  return baseTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Pre-save middleware to generate slug and URL if not provided
caseStudySchema.pre('save', async function (next) {
  // If admin manually provided a url (slug), use it as the slug field too
  if (this.isModified('url') && this.url) {
    // Sanitize the manually entered url to be a valid slug
    const sanitizedSlug = this.url
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if this sanitized slug is unique (excluding this document)
    const existing = await this.constructor.findOne({ slug: sanitizedSlug, _id: { $ne: this._id } });
    if (!existing) {
      this.slug = sanitizedSlug;
      this.url = sanitizedSlug; // Keep url in sync
    }
    // If slug is taken, keep existing slug but still update url
  }

  // Only auto-generate slug from title if no slug exists at all
  if (!this.slug && this.title) {
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

// Ensure slug is always included in JSON responses
caseStudySchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    // Ensure slug is always present in JSON response
    if (!ret.slug && ret.title) {
      ret.slug = doc.generateSlug(ret.title);
    }
    return ret;
  }
});
caseStudySchema.set('toObject', { virtuals: true });

// Static method to populate slugs for existing records
caseStudySchema.statics.populateSlugs = async function () {
  const caseStudies = await this.find({ $or: [{ slug: null }, { slug: { $exists: false } }] });

  for (const caseStudy of caseStudies) {
    if (caseStudy.title) {
      let baseSlug = caseStudy.generateSlug(caseStudy.title);
      let slug = baseSlug;
      let counter = 1;

      // Check for existing slugs and make unique
      while (await this.findOne({ slug: slug, _id: { $ne: caseStudy._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      caseStudy.slug = slug;
      if (!caseStudy.url) {
        caseStudy.url = slug;
      }
      await caseStudy.save();
    }
  }

  return caseStudies.length;
};

export default mongoose.model('CaseStudy', caseStudySchema)
