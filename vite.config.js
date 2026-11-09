import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages hosts the app under /dentalcare-pro; Vercel serves it from the domain root.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? '/dentalcare-pro/' : '/',
})
