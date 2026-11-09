import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the site at https://abdelramanhany6-ai.github.io/dentalcare-pro/
export default defineConfig({
  plugins: [react()],
  base: '/dentalcare-pro/',
})
