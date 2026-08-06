import { expect, test, type Page } from '@playwright/test'

const BASE = process.env.SMOKE_BASE_URL ?? 'https://jid-dev.vercel.app'
const PASSWORD = process.env.SEED_PASSWORD ?? 'JidSeed123!'

async function gotoStable(page: Page, path: string) {
  const target = path.startsWith('http') ? path : `${BASE}${path}`
  let lastError: unknown = null
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      await page.waitForTimeout(800)
      return
    } catch (error) {
      lastError = error
      const message = String(error)
      if (!/ERR_ABORTED|interrupted|Navigation/i.test(message) || attempt === 3) {
        throw error
      }
      await page.waitForTimeout(500)
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function loginAndWait(page: Page, email: string, loginPath = '/login') {
  await gotoStable(page, loginPath)
  await page.locator('input#email').waitFor({ state: 'visible', timeout: 20_000 })
  // Wait for client hydration so submit uses RHF handler (not native GET).
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
  await page.waitForTimeout(400)
  await page.locator('input#email').fill(email)
  await page.locator('input#password').fill(PASSWORD)
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
      // Allow portal bounce chains (/me → /profile → /profile/:id) to settle.
      await page.waitForTimeout(2500)
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
      throw new Error(`login failed for ${email}: ${meaningful.join(' | ')}`)
    }
    await page.waitForTimeout(500)
  }
  throw new Error(`login redirect timeout for ${email}; still at ${page.url()}`)
}

test.describe.configure({ mode: 'serial' })
test.setTimeout(180_000)

const matrix = [
  {
    id: 'individual-complete',
    email: 'individual-complete@jidseed.test',
    expectPath: /\/(me|profile)(?:\/|$)/,
    allow: '/profile',
    deny: '/company/dashboard',
  },
  {
    id: 'individual-new',
    email: 'individual-new@jidseed.test',
    expectPath: /\/(me|profile|me\/onboarding|welcome|individual)(?:\/|$)/,
    allow: '/profile',
    deny: '/company/dashboard',
  },
  {
    id: 'mentor-approved',
    email: 'mentor-approved@jidseed.test',
    expectPath: /\/mentor(?:\/|$)/,
    allow: '/mentor/dashboard',
    deny: '/company/dashboard',
  },
  {
    id: 'business-verified',
    email: 'business-verified@jidseed.test',
    expectPath: /\/company\/dashboard(?:\/|$)/,
    allow: '/company/dashboard',
    deny: '/university/dashboard',
  },
  {
    id: 'business-pending',
    email: 'business-pending@jidseed.test',
    expectPath: /\/company\/(verification-pending|pending-review)(?:\/|$)/,
    allow: '/company/verification-pending',
    deny: '/company/dashboard',
  },
  {
    id: 'university-verified',
    email: 'university-verified@jidseed.test',
    expectPath: /\/university\/dashboard(?:\/|$)/,
    allow: '/university/dashboard',
    deny: '/company/dashboard',
  },
  {
    id: 'university-pending',
    email: 'university-pending@jidseed.test',
    expectPath: /\/university\/pending-review(?:\/|$)/,
    allow: '/university/pending-review',
    deny: '/university/dashboard',
  },
  {
    id: 'staff',
    email: 'staff@jidseed.test',
    expectPath: /\/(login\/mfa|staff\/mfa)(?:\/|\?|$)/,
    allow: '/staff',
    deny: '/sys/dashboard',
    loginPath: '/staff/login',
  },
] as const

for (const c of matrix) {
  test(`matrix ${c.id}`, async ({ page }) => {
    await loginAndWait(page, c.email, 'loginPath' in c ? c.loginPath : '/login')
    const afterLogin = page.url()
    console.log('AFTER_LOGIN', JSON.stringify({ id: c.id, url: afterLogin }))
    expect(afterLogin).toMatch(c.expectPath)

    const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim()
    expect(body.length, `${c.id} blank landing`).toBeGreaterThan(40)
    console.log('LANDING', JSON.stringify({ id: c.id, snippet: body.slice(0, 160) }))

    await gotoStable(page, c.allow)
    await page.waitForTimeout(1200)
    const allowUrl = page.url()
    const allowBody = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim()
    console.log(
      'ALLOW',
      JSON.stringify({ id: c.id, url: allowUrl, snippet: allowBody.slice(0, 160) }),
    )
    expect(allowBody.length, `${c.id} allow blank`).toBeGreaterThan(40)
    if (c.id === 'mentor-approved') {
      expect(allowUrl, 'mentor must not bounce to phone verify').not.toMatch(/verify-phone/)
      expect(allowUrl).toMatch(/\/mentor\//)
    }
    if (c.id === 'staff') {
      expect(allowUrl).toMatch(/mfa/)
    }

    await gotoStable(page, c.deny)
    await page.waitForTimeout(1200)
    const denyPath = new URL(page.url()).pathname
    console.log('DENY', JSON.stringify({ id: c.id, url: page.url() }))
    expect(
      denyPath === c.deny || denyPath === `/en${c.deny}` || denyPath === `/ar${c.deny}`,
    ).toBeFalsy()

    if (c.id === 'individual-complete' || c.id.endsWith('verified') || c.id === 'mentor-approved') {
      const arPath = c.allow
      const enPath = `/en${c.allow}`
      await gotoStable(page, arPath)
      await page.waitForFunction(
        () => {
          const dir = document.documentElement.getAttribute('dir')
          return dir === 'rtl' || dir === 'ltr'
        },
        undefined,
        { timeout: 15_000 },
      )
      const arDir = await page.locator('html').getAttribute('dir')
      await gotoStable(page, enPath)
      await page.waitForFunction(
        () => {
          const dir = document.documentElement.getAttribute('dir')
          return dir === 'rtl' || dir === 'ltr'
        },
        undefined,
        { timeout: 15_000 },
      )
      const enDir = await page.locator('html').getAttribute('dir')
      console.log('LOCALE', JSON.stringify({ id: c.id, arDir, enDir, ar: page.url() }))
      expect(['rtl', 'ltr']).toContain(arDir)
      expect(['rtl', 'ltr']).toContain(enDir)
    }
  })
}

test('public auth routes render', async ({ page }) => {
  for (const path of [
    '/login',
    '/en/login',
    '/staff/login',
    '/en/staff/login',
    '/sys/login',
    '/en/sys/login',
  ]) {
    await gotoStable(page, path)
    await page.waitForTimeout(1000)
    const url = page.url()
    const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim()
    console.log('PUBLIC', JSON.stringify({ path, url, len: body.length }))
    expect(body.length).toBeGreaterThan(20)
    expect(url).toMatch(/login/)
  }
})
