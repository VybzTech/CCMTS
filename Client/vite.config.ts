import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['dispatchhub.lirs.net'],
    proxy: {
      '/api': {
        target: 'http://localhost:9989',
        changeOrigin: true,
      },
    },
  },
  server: {
    allowedHosts: ['dispatchhub.lirs.net'],
    proxy: {
      '/api': {
        target: 'http://localhost:9989',
        changeOrigin: true,
      },
    },
  },
})
