import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: true
  },
  authorName: {
    type: String,
    required: true,
    trim: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft'
  },
  
  // SEO Fields
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
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness for non-null values
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
  
  // Image
  mainImage: {
    type: String,
    trim: true
  },
  
  // Metadata
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
  
  // Timestamps
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
});

// Indexes for better performance
blogSchema.index({ title: 'text', content: 'text', authorName: 'text', keywords: 'text' });
blogSchema.index({ status: 1 });
blogSchema.index({ publishDate: -1 });
blogSchema.index({ authorName: 1 });
// Note: slug and url indexes are automatically created by unique: true constraint
blogSchema.index({ createdAt: -1 });

// Helper function to generate slug
blogSchema.methods.generateSlug = function(baseTitle) {
  return baseTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Pre-save middleware to generate slug and URL if not provided
blogSchema.pre('save', async function(next) {
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
  
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  next();
});

// Virtual for formatted publish date
blogSchema.virtual('formattedPublishDate').get(function() {
  return this.publishDate ? this.publishDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';
});

// Virtual for reading time estimate (based on content length)
blogSchema.virtual('readingTime').get(function() {
  if (!this.content) return 0;
  const wordsPerMinute = 200;
  const wordCount = this.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Virtual for excerpt
blogSchema.virtual('excerpt').get(function() {
  if (!this.content) return '';
  const plainText = this.content.replace(/<[^>]*>/g, '');
  return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
});

// Ensure virtual fields are serialized and slug is always included
blogSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Ensure slug is always present in JSON response
    if (!ret.slug && ret.title) {
      ret.slug = doc.generateSlug(ret.title);
    }
    return ret;
  }
});
blogSchema.set('toObject', { virtuals: true });

// Static method to populate slugs for existing records
blogSchema.statics.populateSlugs = async function() {
  const blogs = await this.find({ $or: [{ slug: null }, { slug: { $exists: false } }] });
  
  for (const blog of blogs) {
    if (blog.title) {
      let baseSlug = blog.generateSlug(blog.title);
      let slug = baseSlug;
      let counter = 1;
      
      // Check for existing slugs and make unique
      while (await this.findOne({ slug: slug, _id: { $ne: blog._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      blog.slug = slug;
      if (!blog.url) {
        blog.url = slug;
      }
      await blog.save();
    }
  }
  
  return blogs.length;
};

export default mongoose.model('Blog', blogSchema);
