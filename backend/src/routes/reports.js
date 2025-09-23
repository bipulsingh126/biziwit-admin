import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import XLSX from 'xlsx'
import slugify from 'slugify'
import Report from '../models/Report.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// Storage config
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext)
    const stamp = Date.now().toString(36)
    cb(null, `${slugify(base, { lower: true, strict: true })}-${stamp}${ext}`)
  }
})
const upload = multer({ storage })

// Helpers
const uniqueSlug = async (title, desired) => {
  let slug = desired || slugify(title, { lower: true, strict: true })
  if (!slug) slug = Date.now().toString(36)
  let i = 0
  // ensure uniqueness
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await Report.findOne({ slug: i ? `${slug}-${i}` : slug }).lean()
    if (!exists) return i ? `${slug}-${i}` : slug
    i += 1
  }
}

// RBAC: admin and editor
router.use(authenticate, requireRole('admin', 'editor'))

// List with filters
router.get('/', async (req, res, next) => {
  try {
    const { q = '', status, category, tags, tag, featured, popular, from, to, sort, limit = 50, offset = 0 } = req.query
    const query = {}

    // Status
    if (status) query.status = status

    // Category
    if (category) query.category = String(category)

    // Tags (supports multiple via comma-separated "tags" or single "tag")
    const tagList = []
    if (tags) tagList.push(...String(tags).split(',').map(t => t.trim().toLowerCase()).filter(Boolean))
    if (tag) tagList.push(String(tag).toLowerCase())
    if (tagList.length) query.tags = { $all: tagList }

    // Featured/Popular flags
    if (featured !== undefined) query.featured = String(featured) === 'true'
    if (popular !== undefined) query.popular = String(popular) === 'true'

    // Date range (publishedAt)
    if (from || to) {
      query.publishedAt = {}
      if (from) query.publishedAt.$gte = new Date(from)
      if (to) query.publishedAt.$lte = new Date(to)
    }

    // Full-text search
    const useText = q && q.trim().length > 0
    const findCond = useText ? { $text: { $search: q }, ...query } : query
    const projection = useText ? { score: { $meta: 'textScore' } } : undefined

    // Sorting
    // sort=newest (default), oldest, popular, featured, relevance (when q provided)
    let sortSpec = { createdAt: -1 }
    if (useText) sortSpec = { score: { $meta: 'textScore' }, createdAt: -1 }
    if (sort === 'oldest') sortSpec = { createdAt: 1 }
    if (sort === 'popular') sortSpec = { popular: -1, createdAt: -1 }
    if (sort === 'featured') sortSpec = { featured: -1, createdAt: -1 }
    if (sort === 'relevance' && useText) sortSpec = { score: { $meta: 'textScore' } }

    const items = await Report.find(findCond, projection)
      .sort(sortSpec)
      .skip(Number(offset))
      .limit(Math.min(200, Number(limit)))
    const total = await Report.countDocuments(findCond)
    res.json({ items, total })
  } catch (e) { next(e) }
})

// Create
router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {}
    const slug = await uniqueSlug(body.title, body.slug)
    const doc = await Report.create({ ...body, slug })
    res.status(201).json(doc)
  } catch (e) { next(e) }
})

// Read one by id
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await Report.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (e) { next(e) }
})

// Update
router.patch('/:id', async (req, res, next) => {
  try {
    const body = { ...req.body }
    if (body.title && !body.slug) {
      body.slug = await uniqueSlug(body.title)
    }
    const updated = await Report.findByIdAndUpdate(req.params.id, body, { new: true })
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (e) { next(e) }
})

// Delete
router.delete('/:id', async (req, res, next) => {
  try {
    const r = await Report.findByIdAndDelete(req.params.id)
    if (!r) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Upload cover image
router.post('/:id/cover', upload.single('file'), async (req, res, next) => {
  try {
    const fileUrl = `/uploads/${path.basename(req.file.path)}`
    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { coverImage: { url: fileUrl, alt: req.body?.alt || '' } },
      { new: true }
    )
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (e) { next(e) }
})

// Upload gallery image
router.post('/:id/images', upload.single('file'), async (req, res, next) => {
  try {
    const fileUrl = `/uploads/${path.basename(req.file.path)}`
    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { $push: { images: { url: fileUrl, alt: req.body?.alt || '' } } },
      { new: true }
    )
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (e) { next(e) }
})

// Generic image upload for rich text editors
router.post('/upload-image', upload.single('file'), (req, res) => {
  const fileUrl = `/uploads/${path.basename(req.file.path)}`
  res.json({ url: fileUrl })
})

// Bulk upload via Excel (columns: title, summary, content, category, tags, featured, popular, metaTitle, metaDescription, status, publishedAt)
router.post('/bulk-upload', upload.single('file'), async (req, res, next) => {
  try {
    const wb = XLSX.readFile(req.file.path)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws)
    const toInsert = []
    for (const row of rows) {
      const title = row.title || row.Title
      if (!title) continue
      const tagsRaw = row.tags || row.Tags || ''
      const tags = String(tagsRaw)
        .split(/[,;]+/)
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
      const slug = await uniqueSlug(title)
      toInsert.push({
        title,
        slug,
        summary: row.summary || row.Summary || '',
        content: row.content || row.Content || '',
        category: row.category || row.Category || '',
        subCategory: row.subCategory || row.SubCategory || '',
        tags,
        featured: String(row.featured || row.Featured || '').toLowerCase() === 'true',
        popular: String(row.popular || row.Popular || '').toLowerCase() === 'true',
        metaTitle: row.metaTitle || row.MetaTitle || '',
        metaDescription: row.metaDescription || row.MetaDescription || '',
        status: (row.status || row.Status || 'draft').toLowerCase(),
        publishedAt: row.publishedAt ? new Date(row.publishedAt) : undefined,
        author: row.author || row.Author || '',
      })
    }
    if (!toInsert.length) return res.status(400).json({ error: 'No valid rows found' })
    const inserted = await Report.insertMany(toInsert)
    res.json({ inserted: inserted.length })
  } catch (e) { next(e) }
})

export default router
