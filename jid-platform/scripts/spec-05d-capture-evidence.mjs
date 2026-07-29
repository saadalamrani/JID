/**
 * Spec 05-D — real browser university journey evidence (Playwright).
 * Local disposable only. Does not commit secrets.
 *
 * Usage (next already on :3000 with disposable .env.local):
 *   node scripts/spec-05d-capture-evidence.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'docs/command-center/reports/ui-evidence/spec-05')
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'
const PASSWORD = 'JidSeed123!'

/** @type {string} */
let activeLocale = 'ar'

function loadEnvLocal() {
  const map = {}
  const envText = fs.readFileSync(path.join(root, '.env.local'), 'utf8').replace(/^\uFEFF/, '')
  for (const line of envText.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    map[line.slice(0, i)] = line.slice(i + 1)
  }
  return map
}

const envLocal = loadEnvLocal()
const supabaseUrl = envLocal.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseAnon) {
  console.error('MISSING_PUBLIC_SUPABASE_ENV')
  process.exit(1)
}

const ACCOUNTS = {
  pending: 'university-pending@jidseed.test',
  verified: 'university-verified@jidseed.test',
  approvedNoPf: 'university-approved-nopf@jidseed.test',
  rejected: 'university-rejected@jidseed.test',
  draft: 'university-draft@jidseed.test',
  emptyDash: 'university-empty-dash@jidseed.test',
}

/** @type {{ file: string, locale: string, viewport: string, actor: string, state: string, route: string, step: string }[]} */
const index = []

function ensureDir() {
  fs.mkdirSync(outDir, { recursive: true })
}

async function login(page, email) {
  await go(page, '/login')
  const result = await page.evaluate(
    async ({ email, password, url, key }) => {
      const mod = await import('https://esm.sh/@supabase/ssr@0.6.1')
      const supabase = mod.createBrowserClient(url, key)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      return { ok: !error && !!data.session, err: error?.message ?? null }
    },
    { email, password: PASSWORD, url: supabaseUrl, key: supabaseAnon },
  )
  if (!result.ok) throw new Error(`login_failed:${email}:${result.err ?? 'no_session'}`)
  await page.waitForTimeout(400)
  await go(page, '/')
}

async function logout(page) {
  await page.context().clearCookies()
  await page.evaluate(() => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      /* ignore */
    }
  })
}

async function go(page, route) {
  const pathPart = route.startsWith('/') ? route : `/${route}`
  // Arabic is the default locale (prefix stripped by next-intl); English keeps /en.
  const url =
    activeLocale === 'ar' ? `${BASE}${pathPart}` : `${BASE}/${activeLocale}${pathPart}`
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await page.waitForLoadState('networkidle', { timeout: 90_000 }).catch(() => {})
  await page.waitForTimeout(1500)
}

async function shot(page, file, meta, opts = {}) {
  if (opts.requireAuthed) {
    const pathName = new URL(page.url()).pathname
    if (pathName.includes('/login') || pathName.includes('/signup/entity-type')) {
      throw new Error(`unexpected_auth_redirect:${file}:${page.url()}`)
    }
    const body = await page.locator('body').innerText().catch(() => '')
    if (/حدث خطأ|Something went wrong|unexpected error|Could not load this page/i.test(body)) {
      throw new Error(`unexpected_error_ui:${file}:${page.url()}`)
    }
  }
  const full = path.join(outDir, file)
  if (process.env.CAPTURE_RESUME === '1' && fs.existsSync(full)) {
    index.push({ file, ...meta })
    console.log('SKIP', file)
    return
  }
  await page.waitForTimeout(400)
  let lastErr = null
  for (const fullPage of [true, false]) {
    try {
      await page.screenshot({
        path: full,
        fullPage,
        timeout: 60_000,
        animations: 'disabled',
      })
      lastErr = null
      break
    } catch (err) {
      lastErr = err
      await page.waitForTimeout(800)
    }
  }
  if (lastErr) throw lastErr
  index.push({ file, ...meta })
  console.log('SHOT', file, page.url())
}

async function walk(browser, locale, viewport, includePrimary, includeRejected) {
  activeLocale = locale
  const context = await browser.newContext({
    ...(viewport === 'mobile375'
      ? devices['iPhone 12']
      : { viewport: { width: 1280, height: 800 } }),
    locale: locale === 'ar' ? 'ar-SA' : 'en-US',
    baseURL: `${BASE}/${locale}`,
    reducedMotion: 'reduce',
  })
  await context.route('**/*fonts.googleapis.com/**', (route) => route.abort())
  await context.route('**/*fonts.gstatic.com/**', (route) => route.abort())
  const page = await context.newPage()
  page.setDefaultTimeout(120_000)
  const vp = viewport === 'mobile375' ? '375' : 'desktop'
  const tag = viewport === 'mobile375' ? `${locale}-mobile-375` : locale

  const meta = (step, actor, state, route) => ({
    locale,
    viewport: vp,
    actor,
    state,
    route,
    step,
  })

  try {
    if (includePrimary) {
      await go(page, '/signup/university')
      await shot(
        page,
        `01-signup-university-${tag}.png`,
        meta('01-signup', 'university', 'anonymous', '/signup/university'),
      )

      await login(page, ACCOUNTS.pending)
      await go(page, '/university/pending-review')
      await page.getByRole('heading').first().waitFor({ timeout: 30_000 }).catch(() => {})
      await shot(
        page,
        `02-pending-review-${tag}.png`,
        meta('02-pending', 'university', 'pending_review', '/university/pending-review'),
        { requireAuthed: true },
      )
      await logout(page)

      await login(page, ACCOUNTS.approvedNoPf)
      await go(page, '/university/create-profile')
      await page.getByRole('heading').first().waitFor({ timeout: 30_000 }).catch(() => {})
      await shot(
        page,
        `03-create-profile-${tag}.png`,
        meta('03-approved-create-profile', 'university', 'approved_without_profile', '/university/create-profile'),
        { requireAuthed: true },
      )
      await logout(page)

      await login(page, ACCOUNTS.draft)
      await go(page, '/university/dashboard')
      await page.waitForTimeout(2000)
      await shot(
        page,
        `04-draft-dashboard-${tag}.png`,
        meta('04-draft-created', 'university', 'draft_profile', '/university/dashboard'),
        { requireAuthed: true },
      )

      await go(page, '/university/profile/edit')
      await page.getByRole('heading').first().waitFor({ timeout: 30_000 }).catch(() => {})
      await shot(
        page,
        `05-profile-edit-${tag}.png`,
        meta('05-profile-edit', 'university', 'draft_profile', '/university/profile/edit'),
        { requireAuthed: true },
      )

      await go(page, '/university/profile/preview')
      await page.waitForTimeout(1500)
      await shot(
        page,
        `06-profile-preview-${tag}.png`,
        meta('06-visitor-preview', 'university', 'draft_profile', '/university/profile/preview'),
        { requireAuthed: true },
      )
      await logout(page)

      await login(page, ACCOUNTS.verified)
      await go(page, '/university/dashboard')
      await page.waitForSelector(
        '[data-testid="university-dashboard-snapshot"], [data-testid="university-dashboard-empty"], [data-testid="university-dashboard-error"]',
        { timeout: 60_000 },
      )
      await shot(
        page,
        `07-dashboard-snapshot-${tag}.png`,
        meta('07-dashboard-snapshot-present', 'university', 'published_with_snapshot', '/university/dashboard'),
        { requireAuthed: true },
      )

      // Directory reference via catalog slug from seed university
      await go(page, '/catalog')
      await page.waitForTimeout(1500)
      await shot(
        page,
        `08-directory-catalog-${tag}.png`,
        meta('08-directory-reference', 'university', 'published_profile', '/catalog'),
        { requireAuthed: true },
      )

      await go(page, '/university/profile/edit?section=correction')
      await page.waitForTimeout(1500)
      await shot(
        page,
        `09-correction-entry-${tag}.png`,
        meta('09-correction-entry', 'university', 'published_profile', '/university/profile/edit?section=correction'),
        { requireAuthed: true },
      )
      await logout(page)

      await login(page, ACCOUNTS.emptyDash)
      await go(page, '/university/dashboard')
      await page.waitForSelector(
        '[data-testid="university-dashboard-empty"], [data-testid="university-dashboard-error"], [data-testid="university-dashboard-snapshot"]',
        { timeout: 60_000 },
      )
      await shot(
        page,
        `10-dashboard-empty-${tag}.png`,
        meta('10-dashboard-snapshot-absent', 'university', 'published_no_snapshot', '/university/dashboard'),
        { requireAuthed: true },
      )
      await logout(page)
    }

    if (includeRejected) {
      await login(page, ACCOUNTS.rejected)
      await go(page, '/university/rejected')
      await page.getByRole('heading').first().waitFor({ timeout: 30_000 }).catch(() => {})
      await shot(
        page,
        `11-rejected-${tag}.png`,
        meta('11-rejected', 'university', 'rejected_eligible', '/university/rejected'),
        { requireAuthed: true },
      )

      await go(page, '/university/reapply')
      await page.waitForTimeout(1500)
      await shot(
        page,
        `12-reapply-${tag}.png`,
        meta('12-reapply', 'university', 'rejected_eligible', '/university/reapply'),
        { requireAuthed: true },
      )
      await logout(page)
    }
  } finally {
    await context.close()
  }
}

async function main() {
  ensureDir()
  const browser = await chromium.launch({ headless: true })
  try {
    // AR desktop primary + rejected
    await walk(browser, 'ar', 'desktop', true, true)
    // EN desktop primary + rejected
    await walk(browser, 'en', 'desktop', true, true)
    // AR mobile dashboards + rejected
    await walk(browser, 'ar', 'mobile375', true, true)
    // EN mobile rejected only (primary mobile covered by AR 375)
    await walk(browser, 'en', 'mobile375', false, true)
  } finally {
    await browser.close()
  }

  const indexMd = [
    '# Spec 05 UI evidence set',
    '',
    'Real browser screenshots captured with Playwright Chromium against local disposable fixtures.',
    'Password for seed accounts: local `JidSeed123!` only — never production.',
    '',
    '| File | Locale | Viewport | Actor | State | Route | Step |',
    '|---|---|---|---|---|---|---|',
    ...index.map(
      (r) =>
        `| \`${r.file}\` | ${r.locale} | ${r.viewport} | ${r.actor} | ${r.state} | \`${r.route}\` | ${r.step} |`,
    ),
    '',
  ].join('\n')

  fs.writeFileSync(path.join(outDir, 'INDEX.md'), indexMd)
  fs.writeFileSync(path.join(outDir, 'INDEX.json'), JSON.stringify(index, null, 2))
  console.log('INDEX_WRITTEN', index.length)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
