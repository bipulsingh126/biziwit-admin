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
import analyticsRoutes from './routes/analytics.js'
import seoPagesRoutes from './routes/seoPages.js'

dotenv.config()

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI']
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '))
  console.error('Please copy .env.example to .env and configure the required variables')
  process.exit(1)
}

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
app.use('/api/analytics', analyticsRoutes)
app.use('/api/seo-pages', seoPagesRoutes)

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Server error' })
})

// Start
connectDB().then(async () => {
  // Only seed users if no admin users exist in the database
  const adminCount = await User.countDocuments({ role: { $in: ['admin', 'super_admin'] } })
  
  if (adminCount === 0) {
    console.log('No admin users found. Seeding default admin users...')
    
    // Seed default admin from environment variables
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
    if (ADMIN_EMAIL && ADMIN_PASSWORD) {
      try {
        await User.create({ 
          name: 'Admin', 
          email: ADMIN_EMAIL, 
          password: ADMIN_PASSWORD, 
          role: 'super_admin'
        })
        console.log('Seeded default admin user')
      } catch (err) {
        console.error('Failed to seed admin user:', err.message)
      }
    }

    // Seed sub-admin only if no admin exists
    const SUB_ADMIN_EMAIL = 'subadmin@biziwit.com'
    const SUB_ADMIN_PASSWORD = 'SubAdmin@123'
    
    try {
      await User.create({ 
        name: 'Sub Admin', 
        email: SUB_ADMIN_EMAIL, 
        password: SUB_ADMIN_PASSWORD, 
        role: 'admin'
      })
      console.log('Seeded sub-admin user')
    } catch (err) {
      console.error('Failed to seed sub-admin user:', err.message)
    }
  } else {
    console.log(`Found ${adminCount} admin user(s). Skipping user seeding.`)
  }

  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
}).catch((err) => {
  console.error('Failed to connect DB', err)
  process.exit(1)
})

