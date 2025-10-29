import { app, connectDB, seedDefaultAdmin } from "./app.js"
import https from 'https'
import http from 'http'
import fs from 'fs'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Handling Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`)
  console.log(`Shutting down the server due to Handling Uncaught Exception`)
  process.exit(1)
})

dotenv.config()

const PORT = process.env.PORT || 4000
const USE_HTTPS = process.env.USE_HTTPS === 'true'
const DOMAIN = process.env.DOMAIN || 'localhost'

// SSL Configuration (only if HTTPS is enabled)
let server
if (USE_HTTPS) {
  try {
    const options = {
      key: fs.readFileSync(path.join(__dirname, "ssl", "privkey.key")),
      cert: fs.readFileSync(path.join(__dirname, "ssl", "fullchain.crt")),
    }
    server = https.createServer(options, app)
    console.log('🔒 HTTPS server configured')
  } catch (error) {
    console.log('⚠️  SSL certificates not found, falling back to HTTP')
    server = http.createServer(app)
  }
} else {
  server = http.createServer(app)
}

// Connect to database and start server
connectDB()
  .then(async () => {
    // Seed default admin users
    await seedDefaultAdmin()
    
    // Start server
    server.listen(PORT, () => {
      const protocol = USE_HTTPS ? 'https' : 'http'
      const serverUrl = `${protocol}://${DOMAIN}:${PORT}`
      
      console.log(`🚀 Server is running on ${serverUrl}`)
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
      
      if (USE_HTTPS) {
        console.log(`🔒 HTTPS enabled on port ${PORT}`)
      } else {
        console.log(`🌐 HTTP server on port ${PORT}`)
      }
      
      console.log(`📊 API Health: ${serverUrl}/health`)
      console.log(`🏠 Local: http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err)
    process.exit(1)
  })

// Unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`)
  console.log(`Shutting down the server due to Unhandled Promise Rejection`)
  
  server.close(() => {
    process.exit(1)
  })
})

