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

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

// Middlewares
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*'}))
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

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Server error' })
})

// Start
connectDB().then(() => {
  // Seed a default admin if specified
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    User.findOne({ email: ADMIN_EMAIL.toLowerCase() }).then(async (existing) => {
      if (!existing) {
        await User.create({ name: 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' })
        console.log('Seeded default admin user')
      }
    }).catch(() => {})
  }

  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
}).catch((err) => {
  console.error('Failed to connect DB', err)
  process.exit(1)
})

