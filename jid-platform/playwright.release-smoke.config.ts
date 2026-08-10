import { defineConfig, devices } from '@playwright/test'

/**
 * Durable release smoke harness.
 *
 * Default target: non-production preview https://jid-dev.vercel.app
 * Local mode: RELEASE_SMOKE_LOCAL=1 (boots `pnpm dev`)
 * Override host: SMOKE_BASE_URL or PLAYWRIGHT_BASE_URL
 * Skip auth matrix: RELEASE_SMOKE_AUTH=0
 */
const useLocal = process.env.RELEASE_SMOKE_LOCAL === '1'
const host = useLocal
  ? (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000')
  : (process.env.SMOKE_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      'https://jid-dev.vercel.app')

export default defineConfig({
  testDir: './tests/e2e/release-smoke',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'release-ar-desktop',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `${host.replace(/\/$/, '')}/ar`,
        locale: 'ar-SA',
      },
    },
    {
      name: 'release-en-desktop',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `${host.replace(/\/$/, '')}/en`,
        locale: 'en-US',
      },
    },
  ],
  webServer: useLocal
    ? {
        command: 'pnpm dev',
        url: host,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,
})
