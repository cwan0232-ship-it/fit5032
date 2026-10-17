import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // In development, /api is forwarded to the deployed REST function (Hosting does this in production)
    proxy: {
      '/api': {
        target: 'https://australia-southeast2-fit5032-76ca9.cloudfunctions.net',
        changeOrigin: true,
      },
    },
  },
})
