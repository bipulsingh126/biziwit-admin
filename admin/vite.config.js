import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        // ============================================
        // VITE PROXY CONFIGURATION (Development Only)
        // ============================================
        // This proxy only works when running: npm run dev
        // For production build, use .htaccess reverse proxy
        
        // ===== OPTION 1: Connect to DEPLOYED Backend (Production API) =====
        // Use this when you want local frontend to connect to live production backend
        // Useful for testing with real production data
        target: 'https://bizwitinsh.plenthia.com',
        
        // ===== OPTION 2: Connect to LOCAL Backend (Localhost) =====
        // Use this when running backend locally with: npm run dev
        // Uncomment line below and comment production target above
        // target: 'http://localhost:4000',
        
        changeOrigin: true,
        secure: false
      }
    }
  }
})
