import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/performance/browser',
  testMatch: '**/*.spec.ts',
  timeout: 120_000,
  expect: {
    timeout: 30_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
  },
  webServer: {
    command:
      'npm run build:performance && npx vite preview --config vite.performance.config.ts --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
