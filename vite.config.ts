import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const githubPagesBase = process.env.GITHUB_PAGES === 'true' ? '/forma-workspace/' : '/'

export default defineConfig({
  base: githubPagesBase,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
})
