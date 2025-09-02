import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import slugify from 'slugify'
import Post from '../models/Post.js'
import { authenticate, requireRole, requirePermission } from '../middleware/auth.js'

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
    const exists = await Post.findOne({ slug: i ? `${slug}-${i}` : slug }).lean()
    if (!exists) return i ? `${slug}-${i}` : slug
    i += 1
  }
}

// Authentication required
router.use(authenticate)

// List with filters
router.get('/', requirePermission('posts', 'view'), async (req, res, next) => {
  try {
    const { q = '', type, status, tags, tag, from, to, sort, limit = 50, offset = 0 } = req.query
    const query = {}

    if (type) query.type = type
    if (status) query.status = status

    const tagList = []
    if (tags) tagList.push(...String(tags).split(',').map(t => t.trim().toLowerCase()).filter(Boolean))
    if (tag) tagList.push(String(tag).toLowerCase())
    if (tagList.length) query.tags = { $all: tagList }

    if (from || to) {
      query.publishedAt = {}
      if (from) query.publishedAt.$gte = new Date(from)
      if (to) query.publishedAt.$lte = new Date(to)
    }

    const useText = q && q.trim().length > 0
    const findCond = useText ? { $text: { $search: q }, ...query } : query
    const projection = useText ? { score: { $meta: 'textScore' } } : undefined

    let sortSpec = { createdAt: -1 }
    if (useText) sortSpec = { score: { $meta: 'textScore' }, createdAt: -1 }
    if (sort === 'oldest') sortSpec = { createdAt: 1 }
    if (sort === 'published') sortSpec = { publishedAt: -1 }

    const items = await Post.find(findCond, projection)
      .sort(sortSpec)
      .skip(Number(offset))
      .limit(Math.min(200, Number(limit)))
    const total = await Post.countDocuments(findCond)
    res.json({ items, total })
  } catch (e) { next(e) }
})

// Create
router.post('/', requirePermission('posts', 'create'), async (req, res, next) => {
  try {
    const body = req.body || {}
    const slug = await uniqueSlug(body.title, body.slug)
    const doc = await Post.create({ ...body, slug })
    res.status(201).json(doc)
  } catch (e) { next(e) }
})

// Read
router.get('/:id', requirePermission('posts', 'view'), async (req, res, next) => {
  try {
    const doc = await Post.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (e) { next(e) }
})

// Update
router.patch('/:id', requirePermission('posts', 'edit'), async (req, res, next) => {
  try {
    const body = { ...req.body }
    if (body.title && !body.slug) body.slug = await uniqueSlug(body.title)
    const updated = await Post.findByIdAndUpdate(req.params.id, body, { new: true })
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (e) { next(e) }
})

// Delete
router.delete('/:id', requirePermission('posts', 'delete'), async (req, res, next) => {
  try {
    const r = await Post.findByIdAndDelete(req.params.id)
    if (!r) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Upload cover image
router.post('/:id/cover', requirePermission('posts', 'edit'), upload.single('file'), async (req, res, next) => {
  try {
    const fileUrl = `/uploads/${path.basename(req.file.path)}`
    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      { coverImage: { url: fileUrl, alt: req.body?.alt || '' } },
      { new: true }
    )
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (e) { next(e) }
})

// Upload gallery image
router.post('/:id/images', requirePermission('posts', 'edit'), upload.single('file'), async (req, res, next) => {
  try {
    const fileUrl = `/uploads/${path.basename(req.file.path)}`
    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { images: { url: fileUrl, alt: req.body?.alt || '' } } },
      { new: true }
    )
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (e) { next(e) }
})

// Generic image upload for rich text editors
router.post('/upload-image', requirePermission('posts', 'create'), upload.single('file'), (req, res) => {
  const fileUrl = `/uploads/${path.basename(req.file.path)}`
  res.json({ url: fileUrl })
})

export default router
