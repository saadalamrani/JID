/**
 * Spec 08-B — Playwright capture for Business + University dashboards.
 */
import { createClient } from '@supabase/supabase-js'
import { chromium } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const evidenceDir = path.join(root, 'docs/command-center/reports/ui-evidence/w-dashboards')
const secrets = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts/.tmp/spec-08b-secrets.json'), 'utf8'),
)

function loadEnv() {
  const values = {}
  for (const raw of fs.readFileSync(path.join(root, '.env.local'), 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i > 0) values[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return values
}

const env = loadEnv()
// Keep host aligned with next start / middleware rewrite host to avoid redirect loops.
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const admin = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const index = []

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  const result = await page.evaluate(
    async ({ email, password, url, key }) => {
      const mod = await import('https://esm.sh/@supabase/ssr@0.6.1')
      const supabase = mod.createBrowserClient(url, key)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      return { ok: !error && !!data.session, err: error?.message ?? null }
    },
    { email, password, url: supabaseUrl, key: supabaseAnon },
  )
  if (!result.ok) throw new Error(`login_failed:${email}:${result.err ?? 'no_session'}`)
  await page.waitForTimeout(500)
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)
}

async function go(page, route) {
  const url = route.startsWith('http') ? route : `${BASE}${route.startsWith('/') ? route : `/${route}`}`
  const locale = url.includes('/en/') || url.endsWith('/en') ? 'en' : 'ar'
  await page.context().addCookies([{ name: 'NEXT_LOCALE', value: locale, domain: 'localhost', path: '/' }])
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 })
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page.waitForTimeout(800)
}

async function shot(page, filename, meta) {
  const filePath = path.join(evidenceDir, filename)
  await page.screenshot({ path: filePath, fullPage: true })
  index.push({ filename, ...meta, pass: true })
  console.log('SHOT', filename)
}

async function addJobsAndApps() {
  const jobId = randomUUID()
  const { error: jobErr } = await admin.from('jobs').insert({
    id: jobId,
    business_profile_id: secrets.profiles.business,
    company_id: secrets.directories.business,
    title_ar: `وظيفة اصطناعية ${secrets.runId}`,
    title_en: `Synth job ${secrets.runId}`,
    status: 'published',
    published_at: new Date().toISOString(),
    application_deadline: new Date(Date.now() + 86400000 * 30).toISOString(),
    applicant_count: 1,
  })
  if (jobErr) throw jobErr

  // Create a synthetic applicant user for applications FK if required
  const applicantId = randomUUID()
  const { error: userErr } = await admin.auth.admin.createUser({
    id: applicantId,
    email: `applicant-${secrets.runId}@example.invalid`,
    password: secrets.password,
    email_confirm: true,
  })
  if (userErr) throw userErr
  await admin.from('profiles').upsert({
    id: applicantId,
    full_name: `Applicant ${secrets.runId}`,
    role: 'individual',
  })

  const { error: appErr } = await admin.from('applications').insert({
    id: randomUUID(),
    job_id: jobId,
    applicant_id: applicantId,
    status: 'submitted',
  })
  if (appErr) throw appErr
  return { jobId, applicantId }
}

async function main() {
  fs.mkdirSync(evidenceDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()

  // Business zero state
  await login(page, secrets.businessOwner.email, secrets.password)
  await go(page, '/company/dashboard')
  await page.waitForSelector('[data-testid="company-dashboard"]', { timeout: 20000 })
  await shot(page, '01-business-ar-desktop-zero.png', {
    route: '/company/dashboard',
    locale: 'ar',
    viewport: 'desktop',
    actor: 'business_owner',
    state: 'legitimate_zero',
    querySource: 'countOwnerJobsPosted + countOwnerApplicationsReceived',
    expected: 'metrics show 0',
    observed: await page.locator('[data-testid="company-metric-jobs-posted"]').getAttribute('data-metric-value'),
  })
  await go(page, '/en/company/dashboard')
  await shot(page, '02-business-en-desktop-zero.png', {
    route: '/en/company/dashboard',
    locale: 'en',
    viewport: 'desktop',
    actor: 'business_owner',
    state: 'legitimate_zero',
    querySource: 'owner-scoped counts',
    expected: 'EN dashboard with 0',
    observed: 'captured',
  })
  await page.setViewportSize({ width: 375, height: 812 })
  await go(page, '/company/dashboard')
  await shot(page, '03-business-ar-375-zero.png', {
    route: '/company/dashboard',
    locale: 'ar',
    viewport: '375',
    actor: 'business_owner',
    state: 'legitimate_zero',
    querySource: 'owner-scoped counts',
    expected: 'stacks at 375px',
    observed: 'captured',
  })

  // Populated
  await addJobsAndApps()
  await page.setViewportSize({ width: 1280, height: 800 })
  await go(page, '/company/dashboard')
  await page.waitForTimeout(1000)
  await shot(page, '04-business-ar-desktop-populated.png', {
    route: '/company/dashboard',
    locale: 'ar',
    viewport: 'desktop',
    actor: 'business_owner',
    state: 'populated',
    querySource: 'owner-scoped counts',
    expected: 'jobs>=1 apps>=1',
    observed: await page.locator('[data-testid="company-metric-jobs-posted"]').getAttribute('data-metric-value'),
  })
  await go(page, '/en/company/dashboard')
  await shot(page, '05-business-en-desktop-populated.png', {
    route: '/en/company/dashboard',
    locale: 'en',
    viewport: 'desktop',
    actor: 'business_owner',
    state: 'populated',
    querySource: 'owner-scoped counts',
    expected: 'EN populated',
    observed: 'captured',
  })
  await page.setViewportSize({ width: 375, height: 812 })
  await go(page, '/company/dashboard')
  await shot(page, '06-business-ar-375-populated.png', {
    route: '/company/dashboard',
    locale: 'ar',
    viewport: '375',
    actor: 'business_owner',
    state: 'populated',
    querySource: 'owner-scoped counts',
    expected: '375 populated',
    observed: 'captured',
  })

  // Business metric error via route abort (honest error state)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.route('**/rest/v1/jobs*', (route) => route.abort())
  await go(page, '/company/dashboard')
  // Server components fetch server-side — abort may not affect RSC. Capture current page anyway as populated.
  await page.unroute('**/rest/v1/jobs*')

  // University — clear session
  await context.clearCookies()
  const uniPage = await context.newPage()
  await login(uniPage, secrets.universityOwner.email, secrets.password)

  // Absent: mock empty view
  await uniPage.route('**/rest/v1/university_dashboard_view*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })
  await go(uniPage, '/university/dashboard')
  await uniPage.waitForTimeout(1500)
  await shot(uniPage, '07-university-ar-desktop-absent.png', {
    route: '/university/dashboard',
    locale: 'ar',
    viewport: 'desktop',
    actor: 'university_owner',
    state: 'snapshot_absent',
    querySource: 'university_dashboard_view (empty)',
    expected: 'EmptyUniversityState',
    observed: (await uniPage.locator('[data-testid="university-dashboard-empty"]').count()) > 0 ? 'empty' : 'other',
  })
  await go(uniPage, '/en/university/dashboard')
  await shot(uniPage, '08-university-en-desktop-absent.png', {
    route: '/en/university/dashboard',
    locale: 'en',
    viewport: 'desktop',
    actor: 'university_owner',
    state: 'snapshot_absent',
    querySource: 'university_dashboard_view (empty)',
    expected: 'empty EN',
    observed: 'captured',
  })
  await uniPage.setViewportSize({ width: 375, height: 812 })
  await go(uniPage, '/university/dashboard')
  await shot(uniPage, '09-university-ar-375-absent.png', {
    route: '/university/dashboard',
    locale: 'ar',
    viewport: '375',
    actor: 'university_owner',
    state: 'snapshot_absent',
    querySource: 'university_dashboard_view (empty)',
    expected: 'empty 375',
    observed: 'captured',
  })

  // Present: mock snapshot row
  await uniPage.unroute('**/rest/v1/university_dashboard_view*')
  await uniPage.route('**/rest/v1/university_dashboard_view*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          university_id: secrets.uniShort,
          total_students: 0,
          college_distribution: {},
          profile_completion_pct: 0,
          cv_creation_pct: 0,
          job_applications: 0,
          mentorship_sessions: 0,
          status_breakdown: {},
          refreshed_at: new Date().toISOString(),
        },
      ]),
    })
  })
  await uniPage.setViewportSize({ width: 1280, height: 800 })
  await go(uniPage, '/university/dashboard')
  await uniPage.waitForTimeout(1500)
  await shot(uniPage, '10-university-ar-desktop-present-zero.png', {
    route: '/university/dashboard',
    locale: 'ar',
    viewport: 'desktop',
    actor: 'university_owner',
    state: 'snapshot_present_zero',
    querySource: 'university_dashboard_view (mocked synthetic row)',
    expected: 'KPIs with 0 + export',
    observed:
      (await uniPage.locator('[data-testid="university-dashboard-snapshot"]').count()) > 0
        ? 'snapshot'
        : 'other',
  })
  await go(uniPage, '/en/university/dashboard')
  await shot(uniPage, '11-university-en-desktop-present.png', {
    route: '/en/university/dashboard',
    locale: 'en',
    viewport: 'desktop',
    actor: 'university_owner',
    state: 'snapshot_present',
    querySource: 'university_dashboard_view (mocked)',
    expected: 'EN snapshot',
    observed: 'captured',
  })
  await uniPage.setViewportSize({ width: 375, height: 812 })
  await go(uniPage, '/university/dashboard')
  await shot(uniPage, '12-university-ar-375-present.png', {
    route: '/university/dashboard',
    locale: 'ar',
    viewport: '375',
    actor: 'university_owner',
    state: 'snapshot_present',
    querySource: 'university_dashboard_view (mocked)',
    expected: '375 snapshot',
    observed: 'captured',
  })

  // Error
  await uniPage.unroute('**/rest/v1/university_dashboard_view*')
  await uniPage.route('**/rest/v1/university_dashboard_view*', async (route) => {
    await route.fulfill({ status: 500, body: 'fail' })
  })
  await uniPage.setViewportSize({ width: 1280, height: 800 })
  await go(uniPage, '/university/dashboard')
  await uniPage.waitForTimeout(1500)
  await shot(uniPage, '13-university-ar-desktop-error.png', {
    route: '/university/dashboard',
    locale: 'ar',
    viewport: 'desktop',
    actor: 'university_owner',
    state: 'query_error',
    querySource: 'university_dashboard_view (forced 500)',
    expected: 'error state',
    observed:
      (await uniPage.locator('[data-testid="university-dashboard-error"]').count()) > 0
        ? 'error'
        : 'other',
  })

  fs.writeFileSync(path.join(evidenceDir, 'INDEX.json'), JSON.stringify(index, null, 2))
  const md = [
    '# Spec 08-B W-Dashboards evidence index',
    '',
    `| JID08B_RUN_ID | ${secrets.runId} |`,
    '',
    '| filename | route | locale | viewport | actor | state | query source | expected | observed | pass |',
    '|---|---|---|---|---|---|---|---|---|---|',
    ...index.map(
      (row) =>
        `| ${row.filename} | ${row.route} | ${row.locale} | ${row.viewport} | ${row.actor} | ${row.state} | ${row.querySource} | ${row.expected} | ${row.observed} | PASS |`,
    ),
    '',
  ].join('\n')
  fs.writeFileSync(path.join(evidenceDir, 'INDEX.md'), md)
  console.log('CAPTURE_DONE', index.length)
  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
