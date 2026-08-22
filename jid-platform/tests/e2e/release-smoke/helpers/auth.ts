import { expect, type Page } from '@playwright/test'
import { SEED_PASSWORD } from '../../../../scripts/lib/seed-safety'
import { gotoStable } from './routes'

/**
 * Deterministic non-production synthetic accounts already present in the repo.
 * Do not invent credentials — reuse shareable seed matrix emails only.
 */
export const RELEASE_SMOKE_AUTH_ACTORS = [
  {
    id: 'individual',
    email: 'individual-complete@jidseed.test',
    allowPath: '/profile',
    expectPath: /\/(me|profile)(?:\/|$)/,
  },
  {
    id: 'business',
    email: 'business-verified@jidseed.test',
    allowPath: '/company/dashboard',
    expectPath: /\/company\/dashboard(?:\/|$)/,
  },
  {
    id: 'university',
    email: 'university-verified@jidseed.test',
    allowPath: '/university/dashboard',
    expectPath: /\/university\/dashboard(?:\/|$)/,
  },
] as const

export type ReleaseSmokeAuthActor = (typeof RELEASE_SMOKE_AUTH_ACTORS)[number]

export function authSmokeEnabled(): boolean {
  // Default ON for nonprod smoke; set RELEASE_SMOKE_AUTH=0 to skip.
  return process.env.RELEASE_SMOKE_AUTH !== '0'
}

export function seedPassword(): string {
  return process.env.SEED_PASSWORD ?? SEED_PASSWORD
}

export async function loginWithSeedAccount(
  page: Page,
  email: string,
  loginPath = '/login',
  baseURL?: string,
) {
  await gotoStable(page, loginPath, baseURL)
  await page.locator('input#email').waitFor({ state: 'visible', timeout: 20_000 })

  await page
    .waitForFunction(
      () => {
        const form = document.querySelector('form')
        return Boolean(form && form.getAttribute('method')?.toLowerCase() === 'post')
      },
      undefined,
      { timeout: 20_000 },
    )
    .catch(() => undefined)

  await page.waitForTimeout(300)
  await page.locator('input#email').fill(email)
  await page.locator('input#password').fill(seedPassword())
  await page.locator('form button[type="submit"]').click()

  const deadline = Date.now() + 45_000
  while (Date.now() < deadline) {
    const href = page.url()
    expect(href, 'password must never appear in the URL').not.toMatch(/[?&]password=/)
    const pathname = new URL(href).pathname
    const leftLogin =
      pathname !== '/login' &&
      pathname !== '/en/login' &&
      pathname !== '/ar/login' &&
      !pathname.endsWith('/staff/login') &&
      !pathname.endsWith('/sys/login')
    if (leftLogin) {
      await page.waitForTimeout(1500)
      return
    }

    const alerts = await page
      .locator('[role="alert"]')
      .allTextContents()
      .catch(() => [])
    const meaningful = alerts
      .map((a) => a.trim())
      .filter(Boolean)
      .filter((a) => !/invalid email|password is required|required/i.test(a))
    if (meaningful.length) {
      throw new Error(`P1 login failed for ${email}: ${meaningful.join(' | ')}`)
    }
    await page.waitForTimeout(500)
  }

  throw new Error(`P1 login redirect timeout for ${email}; still at ${page.url()}`)
}
