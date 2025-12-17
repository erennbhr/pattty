import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base satırı YOK veya base: '/' şeklinde olmalı
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})