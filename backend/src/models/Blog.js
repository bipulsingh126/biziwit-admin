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
blogSchema.index({ url: 1 });
blogSchema.index({ createdAt: -1 });

// Pre-save middleware to generate URL slug if not provided
blogSchema.pre('save', function(next) {
  if (!this.url && this.title) {
    this.url = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
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

// Ensure virtual fields are serialized
blogSchema.set('toJSON', { virtuals: true });
blogSchema.set('toObject', { virtuals: true });

export default mongoose.model('Blog', blogSchema);
