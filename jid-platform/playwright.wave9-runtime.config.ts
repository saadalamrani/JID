import { defineConfig, devices } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const envFile = path.resolve(__dirname, '.vercel/wave9-preview.env')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const idx = line.indexOf('=')
    const key = line.slice(0, idx)
    const value = line.slice(idx + 1)
    if (!process.env[key]) process.env[key] = value
  }
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL
if (!baseURL) throw new Error('PLAYWRIGHT_BASE_URL missing')
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
if (!bypass) throw new Error('VERCEL_AUTOMATION_BYPASS_SECRET missing')

export default defineConfig({
  testDir: './tests/e2e/wave9-runtime',
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 45_000 },
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': bypass,
      'x-vercel-set-bypass-cookie': 'true',
    },
    navigationTimeout: 90_000,
    actionTimeout: 30_000,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
})
