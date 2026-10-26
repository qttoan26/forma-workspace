import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.resolve(rootDir, 'tests/performance/browser'),
  publicDir: false,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  build: {
    outDir: path.resolve(rootDir, 'dist-performance'),
    emptyOutDir: true,
  },
})
