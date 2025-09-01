import { Router } from 'express'
import crypto from 'crypto'
import Subscriber from '../models/Subscriber.js'
import { authenticate, requireRole } from '../middleware/auth.js'

// Lazy Mailchimp loader
let mailchimp = null
async function getMailchimp() {
  if (mailchimp !== null) return mailchimp
  try {
    const mod = await import('@mailchimp/marketing')
    const mc = mod.default || mod
    const { MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX } = process.env
    if (MAILCHIMP_API_KEY && MAILCHIMP_SERVER_PREFIX) {
      mc.setConfig({ apiKey: MAILCHIMP_API_KEY, server: MAILCHIMP_SERVER_PREFIX })
      mailchimp = mc
    } else {
      mailchimp = false
    }
  } catch (_) {
    mailchimp = false
  }
  return mailchimp || null
}

const router = Router()

async function syncToMailchimp(email, name, status = 'subscribed') {
  const mc = await getMailchimp()
  if (!mc) return
  const { MAILCHIMP_LIST_ID } = process.env
  if (!MAILCHIMP_LIST_ID) return
  try {
    await mc.lists.setListMember(MAILCHIMP_LIST_ID, mailchimpClientHash(email), {
      email_address: email,
      status_if_new: status,
      status,
      merge_fields: name ? { FNAME: name } : undefined,
    })
  } catch (_) {
    // ignore mailchimp errors to avoid blocking
  }
}

function mailchimpClientHash(email) {
  // MD5 hash of lowercase email as hex
  return crypto.createHash('md5').update(String(email).toLowerCase()).digest('hex')
}

// Public subscribe
router.post('/subscribe', async (req, res, next) => {
  try {
    const { email, name, source } = req.body || {}
    if (!email) return res.status(400).json({ error: 'Email is required' })
    const existing = await Subscriber.findOne({ email: String(email).toLowerCase() })
    if (existing) {
      if (existing.status !== 'subscribed') {
        existing.status = 'subscribed'
        if (name) existing.name = name
        if (source) existing.source = source
        await existing.save()
        syncToMailchimp(existing.email, existing.name, 'subscribed').catch(() => {})
      }
      return res.json({ ok: true })
    }
    const doc = await Subscriber.create({ email, name, source, status: 'subscribed' })
    syncToMailchimp(doc.email, doc.name, 'subscribed').catch(() => {})
    res.status(201).json({ ok: true })
  } catch (e) { next(e) }
})

// Public unsubscribe
router.post('/unsubscribe', async (req, res, next) => {
  try {
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ error: 'Email is required' })
    const doc = await Subscriber.findOneAndUpdate({ email: String(email).toLowerCase() }, { status: 'unsubscribed' }, { new: true })
    if (!doc) return res.json({ ok: true })
    syncToMailchimp(doc.email, doc.name, 'unsubscribed').catch(() => {})
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Admin-only below
router.use(authenticate, requireRole('admin'))

// List subscribers
router.get('/', async (req, res, next) => {
  try {
    const { q = '', status, limit = 50, offset = 0 } = req.query
    const query = {}
    if (status) query.status = status
    if (q) {
      const rx = new RegExp(q, 'i')
      query.$or = [{ email: rx }, { name: rx }, { source: rx }]
    }
    const items = await Subscriber.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Math.min(1000, Number(limit)))
    const total = await Subscriber.countDocuments(query)
    res.json({ items, total })
  } catch (e) { next(e) }
})

// Add subscriber (admin)
router.post('/', async (req, res, next) => {
  try {
    const { email, name, source, status = 'subscribed' } = req.body || {}
    if (!email) return res.status(400).json({ error: 'Email is required' })
    const doc = await Subscriber.findOneAndUpdate(
      { email: String(email).toLowerCase() },
      { email, name, source, status },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    syncToMailchimp(doc.email, doc.name, status).catch(() => {})
    res.status(201).json(doc)
  } catch (e) { next(e) }
})

// Remove subscriber
router.delete('/:id', async (req, res, next) => {
  try {
    const r = await Subscriber.findByIdAndDelete(req.params.id)
    res.json({ ok: true, deleted: !!r })
  } catch (e) { next(e) }
})

// Export CSV
router.get('/export/csv', async (req, res, next) => {
  try {
    const subs = await Subscriber.find({}).sort({ createdAt: -1 }).lean()
    const header = 'email,name,status,source,createdAt,updatedAt' 
    const rows = subs.map(s => [s.email, s.name || '', s.status, s.source || '', s.createdAt?.toISOString() || '', s.updatedAt?.toISOString() || ''].map(csvEscape).join(','))
    const csv = [header, ...rows].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"')
    res.send(csv)
  } catch (e) { next(e) }
})

function csvEscape(val) {
  const s = String(val ?? '')
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

export default router
