import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
   server: {
    proxy: {
      '/api': {
        target: 'https://api.bizwitresearch.com',
        //procee production -https://api.bizwitresearch.com
        changeOrigin: true,
        secure: true,
      }
    }
  }
}
)
