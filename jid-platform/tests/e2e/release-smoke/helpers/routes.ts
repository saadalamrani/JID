import type { Page } from '@playwright/test'

/** Stable public routes covered by the durable release smoke contract. */
export const PUBLIC_SMOKE_ROUTES = [
  { id: 'home', path: '/' },
  { id: 'catalog', path: '/catalog' },
  { id: 'opportunities', path: '/opportunities' },
  { id: 'login', path: '/login' },
  { id: 'signup', path: '/signup' },
  { id: 'entity-type', path: '/signup/entity-type' },
] as const

export type PublicSmokeRouteId = (typeof PUBLIC_SMOKE_ROUTES)[number]['id']

export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
} as const

export type ViewportName = keyof typeof VIEWPORTS

/** Forbidden user-facing claim terminology on institutional onboarding surfaces. */
export const FORBIDDEN_CLAIM_COPY = [
  /Claim Existing Profile/i,
  /\bClaim Profile\b/i,
  /مطالبة الملف/,
  /مطالبة موجودة/,
  /اطلب المطالبة/,
] as const

export const INSTITUTIONAL_CHAPTER_LABELS_AR = {
  identify: 'حدد جهتك',
  verify: 'أثبت صفتك',
  prepare: 'جهّز ملف الجهة',
} as const

export async function gotoStable(page: Page, path: string, baseURL?: string) {
  const target = path.startsWith('http')
    ? path
    : baseURL
      ? new URL(path, baseURL).toString()
      : path

  let lastError: unknown = null
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      await page.waitForTimeout(400)
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

export async function waitForDocumentDirection(page: Page) {
  await page.waitForFunction(() => {
    const dir = document.documentElement.getAttribute('dir')
    return dir === 'rtl' || dir === 'ltr'
  })
  return page.locator('html').getAttribute('dir')
}

export async function assertPageAlive(page: Page, label: string) {
  const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim()
  if (body.length < 20) {
    throw new Error(`P1 route unavailable / blank landing: ${label} at ${page.url()}`)
  }
  return body
}
