import { Router } from 'express'
import CustomReportRequest from '../models/CustomReportRequest.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// All custom report management requires auth (admin or editor)
router.use(authenticate)

// List with basic filtering
router.get('/', requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const { q = '', status, limit = 50, offset = 0 } = req.query
    const query = {}
    if (status) query.status = status
    if (q) {
      const rx = new RegExp(q, 'i')
      query.$or = [
        { name: rx }, { email: rx }, { company: rx }, { industry: rx }, { requirements: rx }
      ]
    }
    const items = await CustomReportRequest
      .find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Math.min(200, Number(limit)))
    const total = await CustomReportRequest.countDocuments(query)
    res.json({ items, total })
  } catch (e) { next(e) }
})

// Create
router.post('/', requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const body = req.body || {}
    const created = await CustomReportRequest.create(body)
    res.status(201).json(created)
  } catch (e) { next(e) }
})

// Read one
router.get('/:id', requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const doc = await CustomReportRequest.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (e) { next(e) }
})

// Update
router.patch('/:id', requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const updated = await CustomReportRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (e) { next(e) }
})

// Delete
router.delete('/:id', requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const r = await CustomReportRequest.findByIdAndDelete(req.params.id)
    if (!r) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router

