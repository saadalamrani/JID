import { expect, test, type ConsoleMessage, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { loginWithSeedAccount } from '../release-smoke/helpers/auth'
import { gotoStable, waitForDocumentDirection } from '../release-smoke/helpers/routes'

const SEED_EMAIL = 'individual-complete@jidseed.test'
const EVIDENCE_DIR = path.resolve(process.cwd(), 'docs/command-center/wave-9/evidence')

function collectRuntimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${error.message}`)
  })
  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error') {
      const text = message.text()
      if (
        /favicon|Download the React DevTools|hydrat|status of 409|Failed to fetch RSC payload|Falling back to browser navigation/i.test(
          text,
        )
      ) {
        return
      }
      errors.push(`console: ${text}`)
    }
  })
  return errors
}

async function viewportMetrics(page: Page) {
  return page.evaluate(() => ({
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
}

test.describe('Wave 9 Preview runtime proof', () => {
  test.describe.configure({ mode: 'serial' })

  test('unauthorized network is denied and AR/EN/375 surfaces render', async ({ page, request, baseURL }) => {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
    const errors = collectRuntimeErrors(page)
    page.on('request', (request) => {
      if (request.url().includes('znfhladafpajyjwcfzvv')) {
        throw new Error('PRODUCTION supabase host observed — aborting')
      }
    })
    const evidence: Record<string, unknown> = {
      preview: baseURL,
      observedAt: new Date().toISOString(),
    }

    const anonApi = await request.get('/api/me/professional-network')
    evidence.anonApiStatus = anonApi.status()
    expect([401, 403, 307, 308]).toContain(anonApi.status())
    expect(anonApi.status()).toBeLessThan(500)

    await page.setViewportSize({ width: 1280, height: 800 })
    await gotoStable(page, '/ar/network', baseURL)
    await page.waitForURL(/\/(ar\/)?login(?:\/|\?|$)/, { timeout: 45_000 })
    await expect(page.locator('input#email')).toBeVisible({ timeout: 30_000 })
    const unauthUrl = page.url()
    evidence.unauthNetworkUrl = unauthUrl
    await expect(page.getByRole('heading', { name: 'شبكتي المهنية' })).toHaveCount(0)
    evidence.unauthorizedNegativeCase = 'PASS'

    await loginWithSeedAccount(page, SEED_EMAIL, '/login', baseURL)
    evidence.afterLoginUrl = page.url()
    await gotoStable(page, '/network', baseURL)
    await expect(page.getByRole('heading', { name: 'شبكتي المهنية' })).toBeVisible({
      timeout: 60_000,
    })
    expect(await waitForDocumentDirection(page)).toBe('rtl')
    await expect(page.locator('main')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByRole('button', { name: 'إرسال طلب تواصل' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'نشر' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'الخصوصية' })).toBeVisible()
    await expect(page.locator('textarea')).toBeVisible()
    await expect(page.getByText('لا توجد تحديثات بعد.').or(page.locator('article')).first()).toBeVisible()
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, 'wave9-ar-network.png'),
      fullPage: true,
    })
    evidence.ar = 'PASS'

    await gotoStable(page, '/en/network', baseURL)
    await expect(page.getByRole('heading', { name: 'My professional network' })).toBeVisible({
      timeout: 60_000,
    })
    expect(await waitForDocumentDirection(page)).toBe('ltr')
    await expect(page.locator('main')).toHaveAttribute('dir', 'ltr')
    await expect(page.getByRole('button', { name: 'Send connection request' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Publish' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible()
    await expect(page.getByText('No updates yet.').or(page.locator('article')).first()).toBeVisible()
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, 'wave9-en-network.png'),
      fullPage: true,
    })
    evidence.en = 'PASS'

    await page.setViewportSize({ width: 375, height: 812 })
    await gotoStable(page, '/network', baseURL)
    await expect(
      page.getByRole('heading', { name: 'شبكتي المهنية' }).or(
        page.getByRole('heading', { name: 'My professional network' }),
      ),
    ).toBeVisible({ timeout: 60_000 })
    await expect(
      page.getByRole('button', { name: 'إرسال طلب تواصل' }).or(
        page.getByRole('button', { name: 'Send connection request' }),
      ),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'نشر' }).or(page.getByRole('button', { name: 'Publish' })),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'الخصوصية' }).or(page.getByRole('heading', { name: 'Privacy' })),
    ).toBeVisible()
    const mobile = await viewportMetrics(page)
    evidence.mobile = mobile
    expect(mobile.innerWidth, 'innerWidth').toBe(375)
    expect(mobile.scrollWidth, 'scrollWidth').toBeLessThanOrEqual(375)
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, 'wave9-ar-network-375.png'),
      fullPage: true,
    })
    evidence.mobile375 = 'PASS'
    evidence.runtimeErrors = errors
    expect(errors, errors.join('\n')).toEqual([])
    evidence.runtime = 'PASS'

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'WAVE_9_RUNTIME_OBSERVATION.json'),
      JSON.stringify(evidence, null, 2) + '\n',
    )
  })
})
