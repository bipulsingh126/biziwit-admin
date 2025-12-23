import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import LoginHistory from '../models/LoginHistory.js'

const router = Router()

const sign = (user) => {
  const payload = { sub: user._id.toString(), role: user.role }
  const opts = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  return jwt.sign(payload, process.env.JWT_SECRET, opts)
}

// POST /login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const user = await User.findOne({ email: String(email).toLowerCase() })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await user.comparePassword(password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

    const token = sign(user)

    // Log login history
    try {
      const loginRecord = await LoginHistory.create({
        user: user._id,
        email: user.email,
        role: user.role,
        action: 'login',
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      // Emit real-time event to admin
      const { io } = await import('../../server.js')
      io.emit('user:login', {
        id: loginRecord._id,
        user: {
          name: user.name,
          email: user.email
        },
        email: user.email,
        role: user.role,
        action: 'login',
        timestamp: loginRecord.timestamp,
        ip: loginRecord.ip
      })
    } catch (err) {
      console.error('Failed to log login history:', err)
      // Don't fail the login if history logging fails
    }

    res.json({ token, user: user.toSafeJSON() })
  } catch (e) { next(e) }
})

// POST /logout
router.post('/logout', async (req, res, next) => {
  try {
    // Extract user info from token if present
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null

    if (token) {
      try {
        const jwt = await import('jsonwebtoken')
        const payload = jwt.default.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(payload.sub)

        if (user) {
          // Log logout history
          const logoutRecord = await LoginHistory.create({
            user: user._id,
            email: user.email,
            role: user.role,
            action: 'logout',
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
          })

          // Emit real-time event to admin
          const { io } = await import('../../server.js')
          io.emit('user:logout', {
            id: logoutRecord._id,
            user: {
              name: user.name,
              email: user.email
            },
            email: user.email,
            role: user.role,
            action: 'logout',
            timestamp: logoutRecord.timestamp,
            ip: logoutRecord.ip
          })
        }
      } catch (err) {
        console.error('Failed to log logout history:', err)
        // Don't fail the logout if history logging fails
      }
    }

    res.json({ ok: true })
  } catch (e) { next(e) }
})

// GET /me
router.get('/me', async (req, res, next) => {
  try {
    // Optional: allow passing token to retrieve user info
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    res.json({ user: user.toSafeJSON() })
  } catch (e) { next(e) }
})

// GET /history (Protected, Admin only)
router.get('/history', async (req, res, next) => {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub)

    // Check if user is admin or super_admin
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const limit = parseInt(req.query.limit) || 50
    const history = await LoginHistory.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('user', 'name')

    res.json(history)
  } catch (e) { next(e) }
})

export default router
