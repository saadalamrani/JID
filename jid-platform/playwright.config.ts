import { defineConfig, devices } from '@playwright/test'

const baseHost = process.env.PLAYWRIGHT_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'locale-ar',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `${baseHost}/ar`,
        locale: 'ar-SA',
      },
    },
    {
      name: 'locale-en',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `${baseHost}/en`,
        locale: 'en-US',
      },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: baseHost,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
