import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages serves the site from /<repository-name>/ in production
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [vue()],
})
