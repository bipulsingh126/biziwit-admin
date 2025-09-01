import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const authenticate = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || ''
    const token = (auth.startsWith('Bearer ') ? auth.slice(7) : null) || req.cookies?.token
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    req.user = user
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' })
  next()
}
