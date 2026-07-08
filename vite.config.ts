import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Proxy API calls to the Oplyfit backend so the SPA stays same-origin in dev (no CORS).
    proxy: {
      '/api': {
        target: 'https://oplyfit-bfazc6cqe4aheva7.italynorth-01.azurewebsites.net',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
