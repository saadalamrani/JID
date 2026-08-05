import { defineConfig, devices } from '@playwright/test'

const base = process.env.SMOKE_BASE_URL ?? 'https://jid-dev.vercel.app'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/nonprod-account-role-smoke.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: base,
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
})
