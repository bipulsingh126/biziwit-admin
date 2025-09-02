import { Router } from 'express'
import User from '../models/User.js'
import { authenticate, requireRole, requirePermission } from '../middleware/auth.js'

const router = Router()

// Authentication required for all routes
router.use(authenticate)

// List users
router.get('/', requirePermission('users', 'view'), async (req, res, next) => {
  try {
    const { q = '', role, limit = 50, offset = 0 } = req.query
    const query = {}
    if (role) query.role = role
    if (q) {
      const rx = new RegExp(q, 'i')
      query.$or = [{ name: rx }, { email: rx }]
    }
    const items = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Math.min(200, Number(limit)))
    const total = await User.countDocuments(query)
    res.json({ items, total })
  } catch (e) { next(e) }
})

// Create user
router.post('/', requirePermission('users', 'create'), async (req, res, next) => {
  try {
    const user = await User.create(req.body)
    res.status(201).json(user.toSafeJSON())
  } catch (e) { next(e) }
})

// Read user
router.get('/:id', requirePermission('users', 'view'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.json(user)
  } catch (e) { next(e) }
})

// Update user
router.patch('/:id', requirePermission('users', 'edit'), async (req, res, next) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password')
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (e) { next(e) }
})

// Delete user
router.delete('/:id', requirePermission('users', 'delete'), async (req, res, next) => {
  try {
    const r = await User.findByIdAndDelete(req.params.id)
    if (!r) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
