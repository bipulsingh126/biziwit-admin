import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        // Production: Use production domain
        target: 'https://bizwitinsh.plenthia.com',
        
        // Local Development: Uncomment below and comment production target
        // target: 'http://localhost:4000',
        
        changeOrigin: true,
        secure: false
      }
    }
  }
})
