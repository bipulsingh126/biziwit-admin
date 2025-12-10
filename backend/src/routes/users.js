import { Router } from 'express'
import User from '../models/User.js'
import { authenticate, requireRole, requirePermission, requireSuperAdmin } from '../middleware/auth.js'
import bcrypt from 'bcrypt'

const router = Router()

// Authentication required for all routes
router.use(authenticate)

// List users - only super admins can view users
router.get('/', requireSuperAdmin, async (req, res, next) => {
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

// Create user - only super admins can create users
router.post('/', requireSuperAdmin, async (req, res, next) => {
  try {
    const { name, email, password, role, permissions } = req.body

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' })
    }

    // Validate role
    const validRoles = ['super_admin', 'admin', 'editor']
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' })
    }

    // Create user data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'editor'
    }

    // Add permissions for editor role
    if (userData.role === 'editor') {
      // Use provided permissions or default to empty object which will fallback to schema defaults if not specified
      // Or better, explicitly set defaults if permissions are missing to match UI expectations
      userData.permissions = permissions || {
        reports: { view: true, create: true, edit: true, delete: true },
        posts: { view: true, create: true, edit: true, delete: true },
        users: { view: false, create: false, edit: false, delete: false }
      }
    }

    const user = await User.create(userData)
    res.status(201).json(user.toSafeJSON())
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'User with this email already exists' })
    }
    next(e)
  }
})

// Read user - only super admins can view user details
router.get('/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.json(user)
  } catch (e) { next(e) }
})

// Update user - only super admins can edit users
router.patch('/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const { name, email, password, role, permissions } = req.body
    const updateData = {}

    // Validate and update name
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Name cannot be empty' })
      }
      updateData.name = name.trim()
    }

    // Validate and update email
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' })
      }

      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }
      })
      if (existingUser) {
        return res.status(409).json({ error: 'Email already taken by another user' })
      }

      updateData.email = email.toLowerCase().trim()
    }

    // Update password if provided
    if (password) {
      updateData.password = password
    }

    // Validate and update role
    if (role !== undefined) {
      const validRoles = ['super_admin', 'admin', 'editor']
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified' })
      }
      updateData.role = role
    }

    // Update permissions for editor role
    if (permissions !== undefined) {
      updateData.permissions = permissions
    }

    // Hash password if provided
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(updateData.password, salt)
    }

    const updated = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password')
    if (!updated) return res.status(404).json({ error: 'User not found' })
    res.json(updated)
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'Email already taken by another user' })
    }
    next(e)
  }
})

// Delete user - only super admins can delete users
router.delete('/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const r = await User.findByIdAndDelete(req.params.id)
    if (!r) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
