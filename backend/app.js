import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import { connectDB } from './src/config/db.js'
import customReportRoutes from './src/routes/customReports.js'
import megatrendSubmissionRoutes from './src/routes/megatrendSubmissions.js'
import authRoutes from './src/routes/auth.js'
import User from './src/models/User.js'
import reportsRoutes from './src/routes/reports.js'
import ordersRoutes from './src/routes/orders.js'
import Stripe from 'stripe'
import Order from './src/models/Order.js'
import inquiriesRoutes from './src/routes/inquiries.js'
import newsletterRoutes from './src/routes/newsletter.js'
import postsRoutes from './src/routes/posts.js'
import megatrendsRoutes from './src/routes/megatrends.js'
import customReportRequestsRoutes from './src/routes/customReportRequests.js'
import usersRoutes from './src/routes/users.js'
import analyticsRoutes from './src/routes/analytics.js'
import seoPagesRoutes from './src/routes/seoPages.js'
import categoriesRoutes from './src/routes/categories.js'
import blogsRoutes from './src/routes/blogs.js'
import caseStudiesRoutes from './src/routes/caseStudies.js'
import servicePagesRoutes from './src/routes/servicePages.js'

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
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null

// Remove Origin-Agent-Cluster header to prevent browser warnings
app.use((req, res, next) => {
  res.removeHeader('Origin-Agent-Cluster')
  next()
})

// CORS Configuration - Allow multiple origins
app.use(cors({
  origin: 'https://admin.bizwitresearch.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

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
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use('/uploads', express.static(UPLOAD_DIR))

// Health check
app.get('/health', (req, res) => res.json({ ok: true }))

// Favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => res.status(204).end())

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'BiziWit Admin Panel API - Server is running',
    version: '1.0.0',
    status: 'Active'
  })
})

// API Routes
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
app.use('/api/categories', categoriesRoutes)
app.use('/api/blogs', blogsRoutes)
app.use('/api/case-studies', caseStudiesRoutes)
app.use('/api/service-pages', servicePagesRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error occurred:', err)
  res.status(err.status || 500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  })
})

// Seed default admin function
const seedDefaultAdmin = async () => {
  try {
    // Only create admin user if none exists
    const adminCount = await User.countDocuments({ role: { $in: ['admin', 'super_admin'] } })
    
    if (adminCount === 0) {
      console.log('📝 No admin users found. Creating default admin users...')
      
      // Create both mainadmin and admin users
      const defaultAdmins = [
        {
          name: 'Main Admin',
          email: 'mainadmin@biziwit.com',
          password: 'MainAdmin@2024',
          role: 'super_admin'
        },
        {
          name: 'Admin',
          email: 'admin@biziwit.com',
          password: 'Admin@123',
          role: 'admin'
        }
      ]

      for (const adminData of defaultAdmins) {
        try {
          await User.create(adminData)
          console.log(`✅ Created ${adminData.role}: ${adminData.email}`)
        } catch (err) {
          console.error(`❌ Failed to create ${adminData.email}:`, err.message)
        }
      }
    } else {
      console.log('✓ Admin users already exist')
    }
  } catch (error) {
    console.error('✗ Error seeding default admin:', error.message)
  }
}

export { app, connectDB, seedDefaultAdmin }
