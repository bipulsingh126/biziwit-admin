import { Router } from 'express'
import MegatrendSubmission from '../models/MegatrendSubmission.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// Admin-only management
router.use(authenticate, requireRole('super_admin', 'admin'))

// List
router.get('/', async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, q = '' } = req.query
    const query = {}
    if (q) {
      const rx = new RegExp(q, 'i')
      query.$or = [{ name: rx }, { email: rx }, { company: rx }, { role: rx }, { megatrendTitle: rx }]
    }
    const items = await MegatrendSubmission
      .find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Math.min(200, Number(limit)))
    const total = await MegatrendSubmission.countDocuments(query)
    res.json({ items, total })
  } catch (e) { next(e) }
})

// Create
router.post('/', async (req, res, next) => {
  try {
    const created = await MegatrendSubmission.create(req.body)
    res.status(201).json(created)
  } catch (e) { next(e) }
})

// Delete one
router.delete('/:id', async (req, res, next) => {
  try {
    const r = await MegatrendSubmission.findByIdAndDelete(req.params.id)
    if (!r) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router

