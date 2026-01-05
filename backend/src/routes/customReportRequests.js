import { Router } from 'express'
import CustomReportRequest from '../models/CustomReportRequest.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import nodemailer from 'nodemailer'

const router = Router()

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

async function notifyAdmin(crr) {
  const transport = makeTransport()
  if (!transport) return
  const to = process.env.NOTIFY_EMAIL || process.env.SMTP_USER
  if (!to) return
  const subject = `[bizwit] New Custom Report Request from ${crr.company}`
  const text = `Name: ${crr.name}\nEmail: ${crr.email}\nCompany: ${crr.company}\nIndustry: ${crr.industry}\nDeadline: ${crr.deadline || ''}\n\nRequirements:\n${crr.requirements}`
  await transport.sendMail({
    from: process.env.MAIL_FROM || `no-reply@${(process.env.DOMAIN || 'bizwit.local')}`,
    to,
    subject,
    text,
  })
}

// Public submit endpoint
router.post('/submit', async (req, res, next) => {
  try {
    const { name, email, company, industry, requirements } = req.body || {}
    if (!name || !email || !company || !industry || !requirements) {
      return res.status(400).json({ error: 'name, email, company, industry, requirements are required' })
    }
    const doc = await CustomReportRequest.create({
      name,
      email,
      company,
      industry,
      requirements,
      deadline: req.body.deadline,
      notes: req.body.notes,
    })
    notifyAdmin(doc).catch(() => {})
    res.status(201).json({ ok: true })
  } catch (e) { next(e) }
})

// Admin management
router.use(authenticate, requireRole('super_admin', 'admin'))

// List
router.get('/', async (req, res, next) => {
  try {
    const { q = '', status, limit = 50, offset = 0 } = req.query
    const query = {}
    if (status) query.status = status
    if (q) {
      const rx = new RegExp(q, 'i')
      query.$or = [
        { name: rx }, { email: rx }, { company: rx }, { industry: rx }, { requirements: rx }, { notes: rx }
      ]
    }
    const items = await CustomReportRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Math.min(200, Number(limit)))
    const total = await CustomReportRequest.countDocuments(query)
    res.json({ items, total })
  } catch (e) { next(e) }
})

// Read
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await CustomReportRequest.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (e) { next(e) }
})

// Update (status/notes)
router.patch('/:id', async (req, res, next) => {
  try {
    const updated = await CustomReportRequest.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updated) return res.status(404).json({ error: 'Not found' })
    res.json(updated)
  } catch (e) { next(e) }
})

// Delete
router.delete('/:id', async (req, res, next) => {
  try {
    const r = await CustomReportRequest.findByIdAndDelete(req.params.id)
    if (!r) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Respond by email
router.post('/:id/respond', async (req, res, next) => {
  try {
    const doc = await CustomReportRequest.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })

    const { subject, message, status } = req.body || {}
    if (!subject || !message) return res.status(400).json({ error: 'subject and message are required' })

    const transport = makeTransport()
    if (!transport) return res.status(500).json({ error: 'Email not configured' })

    await transport.sendMail({
      from: process.env.MAIL_FROM || `no-reply@${(process.env.DOMAIN || 'bizwit.local')}`,
      to: doc.email,
      subject,
      text: message,
    })

    if (status) {
      doc.status = status
      await doc.save()
    }

    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
