import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import { connectDB } from './config/db.js'
import customReportRoutes from './routes/customReports.js'
import megatrendSubmissionRoutes from './routes/megatrendSubmissions.js'
import authRoutes from './routes/auth.js'
import User from './models/User.js'
import reportsRoutes from './routes/reports.js'
import ordersRoutes from './routes/orders.js'
import Stripe from 'stripe'
import Order from './models/Order.js'
import inquiriesRoutes from './routes/inquiries.js'
import newsletterRoutes from './routes/newsletter.js'
import postsRoutes from './routes/posts.js'
import megatrendsRoutes from './routes/megatrends.js'
import customReportRequestsRoutes from './routes/customReportRequests.js'
import usersRoutes from './routes/users.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null

// Middlewares
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*'}))
// Stripe webhook must be before JSON parser
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.status(400).send('Stripe not configured')
    const sig = req.headers['stripe-signature']
    const event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const orderId = session.metadata?.orderId
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          status: 'paid',
          payment: {
            provider: 'stripe',
            status: 'paid',
            currency: session.currency,
            amount: (session.amount_total || 0) / 100,
            stripe: { paymentIntentId: session.payment_intent, checkoutSessionId: session.id },
          }
        })
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object
      const orderId = session.metadata?.orderId
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, { status: 'failed', 'payment.status': 'failed' })
      }
    }
    res.json({ received: true })
  } catch (err) {
    console.error('Stripe webhook error', err)
    res.status(400).send(`Webhook Error: ${err.message}`)
  }
})

app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))
app.use('/uploads', express.static(UPLOAD_DIR))

// Health
app.get('/health', (req, res) => res.json({ ok: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/custom-reports', customReportRoutes)
app.use('/api/megatrend-submissions', megatrendSubmissionRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/inquiries', inquiriesRoutes)
app.use('/api/newsletter', newsletterRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/megatrends', megatrendsRoutes)
app.use('/api/custom-report-requests', customReportRequestsRoutes)
app.use('/api/users', usersRoutes)

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Server error' })
})

// Start
connectDB().then(() => {
  // Seed default admin and sub-admin if specified
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  
  // Create main admin
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    User.findOne({ email: ADMIN_EMAIL.toLowerCase() }).then(async (existing) => {
      if (!existing) {
        await User.create({ 
          name: 'Admin', 
          email: ADMIN_EMAIL, 
          password: ADMIN_PASSWORD, 
          role: 'admin'
        })
        console.log('Seeded default admin user')
      }
    }).catch(() => {})
  }

  // Create sub-admin
  const SUB_ADMIN_EMAIL = 'subadmin@biziwit.com'
  const SUB_ADMIN_PASSWORD = 'SubAdmin@123'
  
  User.findOne({ email: SUB_ADMIN_EMAIL.toLowerCase() }).then(async (existing) => {
    if (!existing) {
      await User.create({ 
        name: 'Sub Admin', 
        email: SUB_ADMIN_EMAIL, 
        password: SUB_ADMIN_PASSWORD, 
        role: 'admin'
      })
      console.log('Seeded sub-admin user with full access')
    }
  }).catch(() => {})

  // Create test editor user
  const EDITOR_EMAIL = 'editor@biziwit.com'
  const EDITOR_PASSWORD = 'Editor@123'
  
  User.findOne({ email: EDITOR_EMAIL.toLowerCase() }).then(async (existing) => {
    if (!existing) {
      const editorPermissions = {
        reports: { view: true, create: true, edit: true, delete: true },
        posts: { view: true, create: true, edit: true, delete: true }
      }
      await User.create({ 
        name: 'Editor User', 
        email: EDITOR_EMAIL, 
        password: EDITOR_PASSWORD, 
        role: 'editor',
        permissions: editorPermissions
      })
      console.log('Seeded editor user with reports and posts access')
    }
  }).catch(() => {})

  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
}).catch((err) => {
  console.error('Failed to connect DB', err)
  process.exit(1)
})

