/**
 * Spec 06-E — Playwright Chromium real-browser evidence capture.
 * Requires: disposable stack + fixtures + next on PLAYWRIGHT_BASE_URL.
 * Secrets loaded from scripts/.tmp/spec-06e-secrets.json (never committed).
 */
import fs from 'node:fs'
import path from 'node:path'
import { createHmac } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { chromium, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'docs/command-center/reports/ui-evidence/spec-06')
const secrets = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts/.tmp/spec-06e-secrets.json'), 'utf8'),
)
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000'

function loadEnvLocal() {
  const map = {}
  const envText = fs.readFileSync(path.join(root, '.env.local'), 'utf8').replace(/^\uFEFF/, '')
  for (const line of envText.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    map[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return map
}
const envLocal = loadEnvLocal()
const supabaseUrl = envLocal.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnon = envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** @type {any[]} */
const index = []
let activeLocale = 'ar'

function base32ToBuf(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const cleaned = secret.replace(/=+$/, '').toUpperCase()
  let bits = ''
  for (const c of cleaned) {
    const val = alphabet.indexOf(c)
    if (val < 0) continue
    bits += val.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

function totp(secret, step = 30, digits = 6) {
  const key = base32ToBuf(secret)
  const counter = Math.floor(Date.now() / 1000 / step)
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buf.writeUInt32BE(counter & 0xffffffff, 4)
  const hmac = createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return String(code % 10 ** digits).padStart(digits, '0')
}

async function go(page, route) {
  const pathPart = route.startsWith('/') ? route : `/${route}`
  // Arabic default locale strips prefix (localePrefix: as-needed).
  const url =
    activeLocale === 'ar' ? `${BASE}${pathPart}` : `${BASE}/${activeLocale}${pathPart}`
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(800)
}

async function login(page, email, password) {
  // Use the real login form so @supabase/ssr writes auth cookies for middleware/SSR.
  await go(page, '/login')
  await page.locator('#email').waitFor({ state: 'visible' })
  await page.locator('#email').click()
  await page.locator('#email').fill('')
  await page.locator('#email').pressSequentially(email, { delay: 10 })
  await page.locator('#password').click()
  await page.locator('#password').fill('')
  await page.locator('#password').pressSequentially(password, { delay: 10 })
  await Promise.all([
    page
      .waitForURL((url) => !url.pathname.endsWith('/login') || url.pathname.includes('/mfa'), {
        timeout: 60_000,
      })
      .catch(() => null),
    page.locator('form button[type="submit"]').click(),
  ])
  await page.waitForTimeout(800)
  const hasAuthCookie = (await page.context().cookies()).some((c) =>
    c.name.includes('-auth-token'),
  )
  if (!hasAuthCookie) {
    throw new Error(`login_failed:${email}:no_auth_cookie`)
  }
}

async function fillOtp(page, code) {
  const first = page.getByLabel('Digit 1')
  await first.waitFor({ state: 'visible', timeout: 30_000 })
  await first.click({ force: true })
  await page.keyboard.type(code, { delay: 40 })
  await page.waitForTimeout(200)
}

async function ensureStaffAal2(page) {
  // Staff password login lands on /login/mfa (or /staff/mfa). Factor is pre-enrolled in fixtures.
  if (!page.url().includes('/mfa')) {
    await go(page, '/login/mfa')
    await page.waitForTimeout(800)
  }
  if (!page.url().includes('/mfa')) {
    return
  }

  const secret = secrets.staffTotpSecret
  if (!secret) throw new Error('staff_totp_secret_missing')

  const code = totp(secret)
  await fillOtp(page, code)
  await page
    .getByRole('button', { name: /Confirm|تأكيد|Verify|تحقق|Verify code|تأكيد الرمز/i })
    .first()
    .click()
  await page.waitForTimeout(1500)
  if (page.url().includes('/mfa')) {
    // Retry once with a fresh TOTP window if the first code raced the 30s boundary.
    const retry = totp(secret)
    await fillOtp(page, retry)
    await page
      .getByRole('button', { name: /Confirm|تأكيد|Verify|تحقق|Verify code|تأكيد الرمز/i })
      .first()
      .click()
    await page.waitForTimeout(1500)
  }
  // Even if client router stalls on /login/mfa, AAL2 cookies are enough for staff SSR.
  await go(page, '/staff')
  if (page.url().includes('/mfa') || page.url().includes('/login')) {
    throw new Error(`staff_aal2_incomplete url=${page.url()}`)
  }
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

async function shot(page, file, meta) {
  const full = path.join(outDir, file)
  await page.waitForTimeout(300)
  await page.screenshot({ path: full, fullPage: true, timeout: 60_000, animations: 'disabled' })
  index.push({ file, ...meta, observedUrl: page.url() })
  console.log('SHOT', file)
}

async function walk(browser, locale, viewport) {
  activeLocale = locale
  const context = await browser.newContext({
    ...(viewport === 'mobile375'
      ? devices['iPhone 12']
      : { viewport: { width: 1280, height: 800 } }),
    locale: locale === 'ar' ? 'ar-SA' : 'en-US',
    reducedMotion: 'reduce',
  })
  await context.route('**/*fonts.googleapis.com/**', (route) => route.abort())
  await context.route('**/*fonts.gstatic.com/**', (route) => route.abort())
  const page = await context.newPage()
  page.setDefaultTimeout(120_000)
  const vp = viewport === 'mobile375' ? '375' : 'desktop'
  const tag = viewport === 'mobile375' ? `${locale}-mobile-375` : locale
  const slug = secrets.companySlug
  const runId = secrets.runId

  const meta = (step, actor, state, route, expected) => ({
    locale,
    viewport: vp,
    actor,
    state,
    route,
    step,
    runId,
    expected,
  })

  try {
    // --- Correction: public catalog detail (owner on public surface) ---
    await login(page, secrets.users.owner.email, secrets.users.owner.password)
    await go(page, `/catalog/${slug}`)
    await page.waitForTimeout(1000)
    await shot(
      page,
      `01-catalog-detail-${tag}.png`,
      meta(
        '01-catalog-detail',
        'directory_owner',
        'public_catalog_detail',
        `/catalog/${slug}`,
        'Synthetic Directory detail visible',
      ),
    )

    const suggestBtn =
      locale === 'ar'
        ? page.getByRole('button').filter({ hasText: /اقتراح|تصحيح|Suggest|correction/i }).first()
        : page.getByRole('button', { name: /Suggest a correction/i })
    if (await suggestBtn.count()) {
      await suggestBtn.click()
      await page.waitForTimeout(500)
    }
    await shot(
      page,
      `02-correction-form-${tag}.png`,
      meta(
        '02-correction-form',
        'directory_owner',
        'correction_form_open',
        `/catalog/${slug}`,
        'Correction form for allowed Directory field',
      ),
    )

    // Submit only once on Arabic desktop to avoid duplicate pending noise across locales
    if (locale === 'ar' && viewport === 'desktop') {
      const field = page.locator('#correction-field')
      if (await field.count()) {
        await field.selectOption('twitter_url')
        await page.locator('#correction-suggested').fill(`https://x.example/${runId}`)
        await page.locator('#correction-reason').fill(`SYNTH walk ${runId}`)
        const submit = page.getByRole('button', { name: /Submit|إرسال/i })
        await submit.click()
        await page.waitForTimeout(1500)
        await shot(
          page,
          `03-correction-submitted-${tag}.png`,
          meta(
            '03-correction-submitted',
            'directory_owner',
            'suggestion_submitted',
            `/catalog/${slug}`,
            'Suggestion accepted for review',
          ),
        )
      }
    }
    await logout(page)

    // --- Staff queue ---
    await login(page, secrets.users.staff.email, secrets.users.staff.password)
    await ensureStaffAal2(page)
    await go(page, '/staff/directory/suggestions')
    await page.waitForTimeout(1500)
    await shot(
      page,
      `04-staff-suggestions-queue-${tag}.png`,
      meta(
        '04-staff-queue',
        'staff',
        'pending_queue',
        '/staff/directory/suggestions',
        'Pending synthetic suggestions visible with current/proposed values',
      ),
    )

    if (locale === 'ar' && viewport === 'desktop') {
      const approveCard = page.locator('li').filter({ hasText: secrets.suggestions.approve.value })
      if (await approveCard.count()) {
        await approveCard.locator('textarea[id^="notes-"]').fill(`Approve SYNTH ${runId}`)
        await Promise.all([
          page.waitForLoadState('networkidle').catch(() => null),
          approveCard.getByRole('button', { name: /Approve|موافقة/i }).click(),
        ])
        await page.waitForTimeout(2500)
        await go(page, '/staff/directory/suggestions')
        await shot(
          page,
          `05-staff-after-approve-${tag}.png`,
          meta(
            '05-staff-approve',
            'staff',
            'after_approve',
            '/staff/directory/suggestions',
            'Approved suggestion leaves pending queue; toast success',
          ),
        )
      }

      const rejectCard = page.locator('li').filter({ hasText: secrets.suggestions.reject.value })
      if (await rejectCard.count()) {
        await rejectCard.locator('textarea[id^="notes-"]').fill(`Reject SYNTH ${runId}`)
        await Promise.all([
          page.waitForLoadState('networkidle').catch(() => null),
          rejectCard.getByRole('button', { name: /Reject|رفض/i }).click(),
        ])
        await page.waitForTimeout(2500)
        await go(page, '/staff/directory/suggestions')
        await shot(
          page,
          `06-staff-after-reject-${tag}.png`,
          meta(
            '06-staff-reject',
            'staff',
            'after_reject',
            '/staff/directory/suggestions',
            'Rejected suggestion leaves pending queue; no Directory field change',
          ),
        )
      }

      // Missing-target honest failure
      if (secrets.suggestions.missing_target?.id) {
        const orphanCard = page.locator('li').filter({ hasText: `Missing-${runId}` })
        if (await orphanCard.count()) {
          await orphanCard.locator('textarea[id^="notes-"]').fill(`Missing target ${runId}`)
          await orphanCard.getByRole('button', { name: /Approve|موافقة/i }).click()
          await page.waitForTimeout(1500)
          await shot(
            page,
            `07-staff-missing-target-${tag}.png`,
            meta(
              '07-missing-target',
              'staff',
              'directory_missing_error',
              '/staff/directory/suggestions',
              'Honest directory_missing failure; no fake success',
            ),
          )
        }
      }

      // Already-decided read-only (filter All / decided view if present)
      const decidedCard = page.locator('li').filter({ hasText: secrets.suggestions.already_decided.value })
      if (await decidedCard.count()) {
        await shot(
          page,
          `07b-staff-already-decided-${tag}.png`,
          meta(
            '07b-already-decided',
            'staff',
            'already_decided_readonly',
            '/staff/directory/suggestions',
            'Already-decided suggestion is read-only',
          ),
        )
      }
    }
    await logout(page)

    // Empty queue (after primary decisions, may still have walk-submitted items)
    await login(page, secrets.users.staff.email, secrets.users.staff.password)
    await ensureStaffAal2(page)
    // Decide remaining pending via service path is outside browser; reload empty when possible
    await go(page, '/staff/directory/suggestions')
    await shot(
      page,
      `08-staff-queue-state-${tag}.png`,
      meta(
        '08-queue-state',
        'staff',
        'queue_post_decisions',
        '/staff/directory/suggestions',
        'Queue reflects remaining/empty synthetic state',
      ),
    )
    await logout(page)

    // Non-staff denied
    await login(page, secrets.users.individual.email, secrets.users.individual.password)
    await go(page, '/staff/directory/suggestions')
    await page.waitForTimeout(1000)
    await shot(
      page,
      `09-nonstaff-staff-route-${tag}.png`,
      meta(
        '09-nonstaff-denied',
        'individual',
        'staff_route_denied',
        '/staff/directory/suggestions',
        'Non-staff cannot use staff correction controls',
      ),
    )
    await logout(page)

    // Catalog after approve — city changed
    await go(page, `/catalog/${slug}`)
    await shot(
      page,
      `10-catalog-after-approve-${tag}.png`,
      meta(
        '10-catalog-field-updated',
        'anonymous',
        'directory_city_updated',
        `/catalog/${slug}`,
        'Exactly intended synthetic city field reflects approval when applied',
      ),
    )

    // --- Notifications: approval ---
    await login(page, secrets.users.applicantBiz.email, secrets.users.applicantBiz.password)
    await go(page, '/')
    const bell = page.getByRole('button', { name: /Notifications|الإشعارات/i })
    await bell.click()
    await page.waitForTimeout(800)
    await shot(
      page,
      `11-notif-approval-dropdown-${tag}.png`,
      meta(
        '11-notif-approval',
        'verification_applicant',
        'claim_approved_unread',
        '/',
        'Bell unread + localized approval title/body + create-profile continuation',
      ),
    )
    const approveLink = page.locator('[data-testid="notification-link"], a').filter({
      hasText: /Create profile|إنشاء الملف|Verification approved|تمت الموافقة/i,
    }).first()
    if (await approveLink.count()) {
      await approveLink.click()
      await page.waitForTimeout(1500)
      await shot(
        page,
        `12-notif-approval-destination-${tag}.png`,
        meta(
          '12-notif-approval-nav',
          'verification_applicant',
          'create_profile_continuation',
          '/company/create-profile',
          'Action navigates to approved/create-Profile surface; no automatic Profile claim',
        ),
      )
    }
    await logout(page)

    // Rejection notification
    await login(page, secrets.users.applicantBiz.email, secrets.users.applicantBiz.password)
    // mark approve read by deleting from view: open again for reject
    await go(page, '/')
    await page.getByRole('button', { name: /Notifications|الإشعارات/i }).click()
    await page.waitForTimeout(800)
    await shot(
      page,
      `13-notif-rejection-dropdown-${tag}.png`,
      meta(
        '13-notif-rejection',
        'verification_applicant',
        'claim_rejected_with_reason',
        '/',
        'Rejection title/body includes SYNTH reason',
      ),
    )
    const rejectLink = page.locator('a').filter({ hasText: /Verification rejected|تم رفض|View decision|عرض نتيجة/i }).first()
    if (await rejectLink.count()) {
      await rejectLink.click()
      await page.waitForTimeout(1500)
      await shot(
        page,
        `14-notif-rejection-destination-${tag}.png`,
        meta(
          '14-notif-rejection-nav',
          'verification_applicant',
          'rejected_outcome',
          '/company/verification-rejected',
          'Action navigates to real rejected outcome surface',
        ),
      )
    }
    await logout(page)

    // Unknown/empty copy + blank action_url (individual)
    await login(page, secrets.users.individual.email, secrets.users.individual.password)
    await go(page, '/')
    await page.getByRole('button', { name: /Notifications|الإشعارات/i }).click()
    await page.waitForTimeout(800)
    await shot(
      page,
      `15-notif-fallback-blank-url-${tag}.png`,
      meta(
        '15-notif-fallback',
        'individual',
        'empty_copy_and_blank_action_url',
        '/',
        'Unknown/empty copy fallback; blank action_url is not a dead link',
      ),
    )
    await logout(page)

    // Owner suggester notification after approve (directory.correction_*)
    await login(page, secrets.users.owner.email, secrets.users.owner.password)
    await go(page, '/')
    await page.getByRole('button', { name: /Notifications|الإشعارات/i }).click()
    await page.waitForTimeout(800)
    await shot(
      page,
      `16-suggester-correction-notif-${tag}.png`,
      meta(
        '16-suggester-notify',
        'directory_owner',
        'directory_correction_notification',
        '/',
        'Suggester notification when suggested_by identity supported; no dead link if action_url null',
      ),
    )
    await logout(page)
  } finally {
    await context.close()
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    await walk(browser, 'ar', 'desktop')
    await walk(browser, 'en', 'desktop')
    await walk(browser, 'ar', 'mobile375')
  } finally {
    await browser.close()
  }
  fs.writeFileSync(path.join(outDir, 'INDEX.json'), JSON.stringify(index, null, 2))
  console.log('CAPTURE_DONE', index.length)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
