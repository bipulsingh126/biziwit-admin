import mongoose from 'mongoose'

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  alt: { type: String, trim: true },
}, { _id: false })

const ReportSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subTitle: { type: String, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  summary: { type: String, trim: true },
  content: { type: String }, // HTML or rich text JSON string
  coverImage: ImageSchema,
  images: [ImageSchema],
  category: { type: String, trim: true }, // This will be used as 'domain'
  subCategory: { type: String, trim: true }, // This will be used as 'subDomain'
  tags: [{ type: String, trim: true, lowercase: true }],
  featured: { type: Boolean, default: false },
  popular: { type: Boolean, default: false },
  // License fields
  excelDataPackLicense: { type: String, trim: true },
  singleUserLicense: { type: String, trim: true },
  enterpriseLicensePrice: { type: String, trim: true },
  // SEO
  metaTitle: { type: String, trim: true },
  metaDescription: { type: String, trim: true },
  metaKeywords: { type: String, trim: true },
  canonicalUrl: { type: String, trim: true },
  focusKeyword: { type: String, trim: true },
  // Open Graph
  ogTitle: { type: String, trim: true },
  ogDescription: { type: String, trim: true },
  ogImage: { type: String, trim: true },
  // Twitter Cards
  twitterTitle: { type: String, trim: true },
  twitterDescription: { type: String, trim: true },
  twitterImage: { type: String, trim: true },
  // Advanced SEO
  schema: { type: String, enum: ['Article', 'BlogPosting', 'NewsArticle', 'Report', 'WebPage'], default: 'Article' },
  noIndex: { type: Boolean, default: false },
  noFollow: { type: Boolean, default: false },
  altText: { type: String, trim: true },
  // Publishing
  status: { type: String, enum: ['draft', 'published', 'active', 'archived'], default: 'draft', index: true },
  publishedAt: { type: Date },
  lastUpdated: { type: Date, default: Date.now },
  author: { type: String, trim: true },
  // Additional Settings
  visibility: { type: String, enum: ['public', 'private', 'unlisted', 'members-only'], default: 'public' },
  accessLevel: { type: String, enum: ['free', 'premium', 'subscription', 'one-time-purchase'], default: 'free' },
  downloadable: { type: Boolean, default: true },
  commentsEnabled: { type: Boolean, default: true },
  socialSharing: { type: Boolean, default: true },
  printable: { type: Boolean, default: true },
  language: { type: String, default: 'en' },
  region: { type: String, default: 'global' },
  industry: { type: String, trim: true },
  reportType: { type: String, default: 'market-research' },
  pages: { type: Number },
  format: { type: String, enum: ['pdf', 'html', 'docx', 'pptx', 'xlsx'], default: 'pdf' },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  validUntil: { type: Date },
  version: { type: String, default: '1.0' },
  lastReviewed: { type: Date },
  reviewedBy: { type: String, trim: true },
  approvalRequired: { type: Boolean, default: false },
  autoPublish: { type: Boolean, default: false },
  notifySubscribers: { type: Boolean, default: false },
  trackAnalytics: { type: Boolean, default: true },
  allowIndexing: { type: Boolean, default: true },
}, { timestamps: true })

// Full-text search index
ReportSchema.index({ title: 'text', summary: 'text', content: 'text', tags: 'text', category: 'text' })

export default mongoose.model('Report', ReportSchema)
