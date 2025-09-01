import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

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
    res.json({ token, user: user.toSafeJSON() })
  } catch (e) { next(e) }
})

// POST /logout (no-op for JWT; client should discard token)
router.post('/logout', (req, res) => {
  res.json({ ok: true })
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

export default router
