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
      inquiryType: req.body.inquiryType || 'General Inquiry',
      pageReportTitle: req.body.pageReportTitle,
      source: req.body.source || 'website',
      priority: req.body.priority || 'medium',
      meta: req.body.meta || {},
    })
    // Send email notification (non-blocking)
    sendNotification(doc).catch(() => {})
    res.status(201).json({ ok: true, inquiry: doc })
  } catch (e) { next(e) }
})

// Admin-only below
router.use(authenticate, requireRole('admin'))

// List
router.get('/', async (req, res, next) => {
  try {
    const { q = '', status, inquiryType, priority, limit = 50, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
    const query = {}
    
    // Filters
    if (status && status !== 'all') query.status = status
    if (inquiryType && inquiryType !== 'all') query.inquiryType = inquiryType
    if (priority && priority !== 'all') query.priority = priority
    
    // Search
    if (q) {
      const rx = new RegExp(q, 'i')
      query.$or = [
        { name: rx }, 
        { email: rx }, 
        { phone: rx }, 
        { company: rx }, 
        { subject: rx }, 
        { message: rx },
        { inquiryNumber: rx },
        { pageReportTitle: rx }
      ]
    }
    
    // Sort
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    
    const items = await Inquiry.find(query)
      .populate('assignedTo', 'name email')
      .sort(sortOptions)
      .skip(Number(offset))
      .limit(Math.min(200, Number(limit)))
      
    const total = await Inquiry.countDocuments(query)
    
    // Get summary stats
    const stats = await Inquiry.aggregate([
      { $group: { 
        _id: '$status', 
        count: { $sum: 1 } 
      }}
    ])
    
    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count
      return acc
    }, {})
    
    res.json({ items, total, statusCounts })
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

// Bulk operations
router.post('/bulk', async (req, res, next) => {
  try {
    const { action, ids, data } = req.body
    if (!action || !ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Action and ids array are required' })
    }

    let result
    switch (action) {
      case 'delete':
        result = await Inquiry.deleteMany({ _id: { $in: ids } })
        break
      case 'update_status':
        if (!data?.status) return res.status(400).json({ error: 'Status is required' })
        result = await Inquiry.updateMany(
          { _id: { $in: ids } }, 
          { status: data.status, ...(data.status === 'resolved' ? { resolvedAt: new Date() } : {}) }
        )
        break
      case 'update_priority':
        if (!data?.priority) return res.status(400).json({ error: 'Priority is required' })
        result = await Inquiry.updateMany({ _id: { $in: ids } }, { priority: data.priority })
        break
      case 'assign':
        result = await Inquiry.updateMany({ _id: { $in: ids } }, { assignedTo: data.assignedTo })
        break
      default:
        return res.status(400).json({ error: 'Invalid action' })
    }

    res.json({ ok: true, modified: result.modifiedCount })
  } catch (e) { next(e) }
})

// Export inquiries
router.get('/export/csv', async (req, res, next) => {
  try {
    const { q = '', status, inquiryType, priority } = req.query
    const query = {}
    
    // Apply same filters as list endpoint
    if (status && status !== 'all') query.status = status
    if (inquiryType && inquiryType !== 'all') query.inquiryType = inquiryType
    if (priority && priority !== 'all') query.priority = priority
    
    if (q) {
      const rx = new RegExp(q, 'i')
      query.$or = [
        { name: rx }, { email: rx }, { phone: rx }, { company: rx }, 
        { subject: rx }, { message: rx }, { inquiryNumber: rx }, { pageReportTitle: rx }
      ]
    }
    
    const inquiries = await Inquiry.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(1000) // Limit export to 1000 records
    
    // Generate CSV
    const csvHeaders = [
      'Inquiry Number', 'Date', 'Name', 'Email', 'Phone', 'Company', 
      'Inquiry Type', 'Page/Report Title', 'Subject', 'Message', 
      'Status', 'Priority', 'Assigned To', 'Source'
    ]
    
    const csvRows = inquiries.map(inquiry => [
      inquiry.inquiryNumber || '',
      inquiry.createdAt.toISOString().split('T')[0],
      inquiry.name || '',
      inquiry.email || '',
      inquiry.phone || '',
      inquiry.company || '',
      inquiry.inquiryType || '',
      inquiry.pageReportTitle || '',
      inquiry.subject || '',
      `"${(inquiry.message || '').replace(/"/g, '""')}"`, // Escape quotes in message
      inquiry.status || '',
      inquiry.priority || '',
      inquiry.assignedTo?.name || '',
      inquiry.source || ''
    ])
    
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n')
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="inquiries-${new Date().toISOString().split('T')[0]}.csv"`)
    res.send(csvContent)
  } catch (e) { next(e) }
})

// Get inquiry types and priorities for filters
router.get('/metadata', async (req, res, next) => {
  try {
    const inquiryTypes = [
      'General Inquiry', 
      'Report Request', 
      'Custom Report', 
      'Technical Support', 
      'Partnership', 
      'Media Inquiry',
      'Inquiry Before Buying',
      'Request for Sample',
      'Talk to Analyst/Expert',
      'Buy Now',
      'Contact Us',
      'Submit Your Profile',
      'Download White Paper',
      'Individual Service Page',
      'Other'
    ]
    const priorities = ['low', 'medium', 'high', 'urgent']
    const statuses = ['new', 'open', 'in_progress', 'resolved', 'closed']
    
    res.json({ inquiryTypes, priorities, statuses })
  } catch (e) { next(e) }
})

export default router
