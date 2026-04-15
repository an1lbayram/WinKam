import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Electron "file://" icin asset path'leri goreli olmalı
  base: './',
  plugins: [react(), tailwindcss()],
})
