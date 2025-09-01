import { Router } from 'express'
import nodemailer from 'nodemailer'
import Inquiry from '../models/Inquiry.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// Mailer init (if configured)
function makeTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env
  if (!SMTP_HOST) return null
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_SECURE || 'false') === 'true',
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  })
}

async function sendNotification(inquiry) {
  const transport = makeTransport()
  if (!transport) return
  const to = process.env.NOTIFY_EMAIL || process.env.SMTP_USER
  if (!to) return
  const subject = `[BiziWit] New Inquiry: ${inquiry.subject || inquiry.name}`
  const text = `New inquiry received\n\nName: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone || ''}\nCompany: ${inquiry.company || ''}\nSubject: ${inquiry.subject || ''}\n\nMessage:\n${inquiry.message}`
  await transport.sendMail({
    from: process.env.MAIL_FROM || `no-reply@${(process.env.DOMAIN || 'biziwit.local')}`,
    to,
    subject,
    text,
  })
}

// Public submit
router.post('/submit', async (req, res, next) => {
  try {
    const { name, email, message } = req.body || {}
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message are required' })
    const doc = await Inquiry.create({
      name,
      email,
      phone: req.body.phone,
      company: req.body.company,
      subject: req.body.subject,
      message,
      source: req.body.source || 'website',
      meta: req.body.meta || {},
    })
    // Send email notification (non-blocking)
    sendNotification(doc).catch(() => {})
    res.status(201).json({ ok: true })
  } catch (e) { next(e) }
})

// Admin-only below
router.use(authenticate, requireRole('admin'))

// List
router.get('/', async (req, res, next) => {
  try {
    const { q = '', status, limit = 50, offset = 0 } = req.query
    const query = {}
    if (status) query.status = status
    if (q) {
      const rx = new RegExp(q, 'i')
      query.$or = [
        { name: rx }, { email: rx }, { phone: rx }, { company: rx }, { subject: rx }, { message: rx }
      ]
    }
    const items = await Inquiry.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Math.min(200, Number(limit)))
    const total = await Inquiry.countDocuments(query)
    res.json({ items, total })
  } catch (e) { next(e) }
})

// Read
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await Inquiry.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (e) { next(e) }
})

// Update (e.g., change status or add notes in meta)
router.patch('/:id', async (req, res, next) => {
  try {
    const updated = await Inquiry.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (e) { next(e) }
})

// Delete
router.delete('/:id', async (req, res, next) => {
  try {
    const r = await Inquiry.findByIdAndDelete(req.params.id)
    if (!r) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
