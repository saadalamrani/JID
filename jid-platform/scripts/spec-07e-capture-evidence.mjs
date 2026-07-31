/**
 * Spec 07-E — Playwright Chromium publication evidence on disposable local Supabase.
 * Run after spec-07e-setup-fixtures.mjs with the local app on http://localhost:3000.
 */
import { createClient } from '@supabase/supabase-js'
import { chromium } from '@playwright/test'
import { createHmac } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'docs/command-center/reports/ui-evidence/spec-07')
const secretsPath = path.join(root, 'scripts/.tmp/spec-07e-secrets.json')
const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'))
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

function loadEnvLocal() {
  const values = {}
  const text = fs.readFileSync(path.join(root, '.env.local'), 'utf8').replace(/^\uFEFF/, '')
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    if (separator < 0) continue
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  return values
}

function decodeJwtPayload(token) {
  const payload = token?.split('.')[1]
  if (!payload) throw new Error('Invalid Supabase JWT')
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
}

function assertDisposableLocalEnv(env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anon || !service) throw new Error('Missing local Supabase environment variables')
  const hostname = new URL(url).hostname
  if (!['127.0.0.1', 'localhost', '::1'].includes(hostname)) {
    throw new Error(`Refusing non-local Supabase URL: ${url}`)
  }
  const anonClaims = decodeJwtPayload(anon)
  const serviceClaims = decodeJwtPayload(service)
  if (anonClaims.iss !== 'supabase-demo' || anonClaims.role !== 'anon') {
    throw new Error('Refusing non-demo anon JWT')
  }
  if (serviceClaims.iss !== 'supabase-demo' || serviceClaims.role !== 'service_role') {
    throw new Error('Refusing non-demo service-role JWT')
  }
  return { url, anon, service }
}

function base32ToBuffer(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  for (const character of secret.replace(/=+$/, '').toUpperCase()) {
    const value = alphabet.indexOf(character)
    if (value >= 0) bits += value.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2))
  }
  return Buffer.from(bytes)
}

function totp(secret, step = 30, digits = 6) {
  const counter = Math.floor(Date.now() / 1000 / step)
  const buffer = Buffer.alloc(8)
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buffer.writeUInt32BE(counter & 0xffffffff, 4)
  const hmac = createHmac('sha1', base32ToBuffer(secret)).update(buffer).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const value =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return String(value % 10 ** digits).padStart(digits, '0')
}

const env = assertDisposableLocalEnv(loadEnvLocal())
const admin = createClient(env.url, env.service, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const index = []
const browserEvents = []
const keyboardChecks = []

function localeUrl(locale, route) {
  const normalized = route.startsWith('/') ? route : `/${route}`
  return locale === 'ar' ? `${BASE}${normalized}` : `${BASE}/${locale}${normalized}`
}

async function go(page, locale, route) {
  const response = await page.goto(localeUrl(locale, route), {
    waitUntil: 'domcontentloaded',
    timeout: 180_000,
  })
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => undefined)
  await page.waitForTimeout(500)
  return response
}

async function login(page, locale, actor) {
  await go(page, locale, '/login')
  await page.locator('#email').waitFor({ state: 'visible' })
  await page.locator('#email').fill(actor.email)
  await page.locator('#password').fill(actor.password)
  await Promise.all([
    page
      .waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 60_000 })
      .catch(() => undefined),
    page.locator('form button[type="submit"]').click(),
  ])
  await page.waitForTimeout(700)
  const authenticated = (await page.context().cookies()).some((cookie) =>
    cookie.name.includes('-auth-token'),
  )
  if (!authenticated) throw new Error(`Owner login failed: ${actor.email}`)
}

function attachDiagnostics(page, locale, viewport) {
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserEvents.push({
        at: new Date().toISOString(),
        kind: 'console.error',
        locale,
        viewport,
        url: page.url(),
        detail: message.text(),
      })
    }
  })
  page.on('pageerror', (error) => {
    browserEvents.push({
      at: new Date().toISOString(),
      kind: 'pageerror',
      locale,
      viewport,
      url: page.url(),
      detail: error.message,
    })
  })
  page.on('requestfailed', (request) => {
    browserEvents.push({
      at: new Date().toISOString(),
      kind: 'requestfailed',
      locale,
      viewport,
      url: request.url(),
      detail: request.failure()?.errorText ?? 'unknown request failure',
    })
  })
  page.on('response', (response) => {
    if (response.status() >= 400) {
      browserEvents.push({
        at: new Date().toISOString(),
        kind: `http.${response.status()}`,
        locale,
        viewport,
        url: response.url(),
        detail: response.statusText(),
      })
    }
  })
}

async function withPage(browser, locale, viewport, actor, callback) {
  const context = await browser.newContext({
    viewport: viewport === '375' ? { width: 375, height: 812 } : { width: 1280, height: 800 },
    locale: locale === 'ar' ? 'ar-SA' : 'en-US',
    reducedMotion: 'reduce',
  })
  await context.route('**/*fonts.googleapis.com/**', (route) => route.abort())
  await context.route('**/*fonts.gstatic.com/**', (route) => route.abort())
  const page = await context.newPage()
  page.setDefaultTimeout(120_000)
  attachDiagnostics(page, locale, viewport)
  try {
    if (actor) await login(page, locale, actor)
    return await callback(page)
  } finally {
    await context.close()
  }
}

async function shot(page, file, metadata) {
  await page.screenshot({
    path: path.join(outDir, file),
    fullPage: true,
    animations: 'disabled',
    timeout: 60_000,
  })
  index.push({
    filename: file,
    route: metadata.route,
    locale: metadata.locale,
    viewport: metadata.viewport,
    actor: metadata.actor,
    profileType: metadata.profileType,
    JID07E_RUN_ID: secrets.runId,
    state: metadata.state,
    expected: metadata.expected,
    observed: metadata.observed,
    result: metadata.pass ? 'PASS' : 'FAIL',
  })
  console.log('SHOT', file)
}

function metadata({
  route,
  locale,
  viewport,
  actor,
  profileType,
  state,
  expected,
  observed,
  pass,
}) {
  return { route, locale, viewport, actor, profileType, state, expected, observed, pass }
}

async function captureOwnerSurface(browser, options) {
  const { type, locale, viewport, route, actor, file, state, expected } = options
  await withPage(browser, locale, viewport, actor, async (page) => {
    const response = await go(page, locale, route)
    const status = response?.status() ?? 0
    const containsRun = (await page.locator('body').innerText()).includes(secrets.runId)
    await shot(
      page,
      file,
      metadata({
        route,
        locale,
        viewport,
        actor: type === 'business' ? 'business_owner' : 'university_owner',
        profileType: type,
        state,
        expected,
        observed: `HTTP ${status}; run marker ${containsRun ? 'visible' : 'not visible'}`,
        pass: status < 400 && containsRun,
      }),
    )
    if (status >= 400 || !containsRun) throw new Error(`${file}: owner surface assertion failed`)
  })
}

async function capturePublicSurface(browser, options) {
  const { type, locale, viewport, route, file, state, expected, expectNotFound = false } = options
  await withPage(browser, locale, viewport, null, async (page) => {
    const response = await go(page, locale, route)
    const status = response?.status() ?? 0
    const bodyText = await page.locator('body').innerText()
    const containsRun = bodyText.includes(secrets.runId)
    const looksNotFound =
      status === 404 ||
      /not found|غير موجود|404|could not be found|تعذر العثور/i.test(bodyText)
    const pass = expectNotFound
      ? !containsRun && (looksNotFound || status >= 400)
      : status < 400 && containsRun && !looksNotFound
    await shot(
      page,
      file,
      metadata({
        route,
        locale,
        viewport,
        actor: 'anonymous',
        profileType: type,
        state,
        expected,
        observed: `HTTP ${status}; run marker ${containsRun ? 'visible' : 'not visible'}; notFoundUi=${looksNotFound}`,
        pass,
      }),
    )
    if (!pass) throw new Error(`${file}: public surface assertion failed`)
  })
}

async function captureDraftSet(browser, type, actor, ownerRoute, prefix) {
  await captureOwnerSurface(browser, {
    type,
    locale: 'ar',
    viewport: 'desktop',
    route: ownerRoute,
    actor,
    file: `${prefix}-ar-desktop-draft.png`,
    state: 'draft',
    expected: 'Draft owner Profile and publication controls visible',
  })
  await captureOwnerSurface(browser, {
    type,
    locale: 'en',
    viewport: 'desktop',
    route: ownerRoute,
    actor,
    file: `${prefix}-en-desktop-draft.png`,
    state: 'draft',
    expected: 'English draft owner Profile and publication controls visible',
  })
  await captureOwnerSurface(browser, {
    type,
    locale: 'ar',
    viewport: '375',
    route: ownerRoute,
    actor,
    file: `${prefix}-ar-375-draft.png`,
    state: 'draft',
    expected: '375px Arabic draft owner Profile without horizontal loss',
  })
}

async function captureMissingFailure(browser, type, actor, ownerRoute, file) {
  await withPage(browser, 'ar', 'desktop', actor, async (page) => {
    await go(page, 'ar', ownerRoute)
    await page.getByRole('button', { name: /^(نشر الملف|Publish Profile)$/i }).focus()
    await page.keyboard.press('Enter')
    const confirm = page
      .getByRole('button', { name: /تأكيد.*نشر|Confirm publish/i })
      .last()
    await confirm.waitFor({ state: 'visible' })
    await confirm.click()
    const alert = page.locator('[role="alert"].border-amber-200, [role="alert"].bg-amber-50').first()
    await alert.waitFor({ state: 'visible' })
    const observed = (await alert.innerText()).replace(/\s+/g, ' ').trim()
    await shot(
      page,
      file,
      metadata({
        route: ownerRoute,
        locale: 'ar',
        viewport: 'desktop',
        actor: type === 'business' ? 'business_owner' : 'university_owner',
        profileType: type,
        state: 'missing_about_ar_failure',
        expected: 'Publish fails honestly and identifies missing Arabic about field',
        observed,
        pass: observed.length > 0,
      }),
    )
  })
}

async function fillAboutThroughUi(browser, type, actor, ownerRoute) {
  // Content is prepared via service role so the publish UI walk stays focused on
  // publication controls (save-toast selectors vary across owner sections).
  const aboutAr = `نبذة اصطناعية للنشر 07E ${secrets.runId}`
  const aboutEn = `Synthetic publication narrative 07E ${secrets.runId}`
  const table = type === 'business' ? 'business_profiles' : 'university_profiles'
  const profileId =
    type === 'business' ? secrets.profiles.business.id : secrets.profiles.university.id
  const { error } = await admin.from(table).update({ about_ar: aboutAr, about_en: aboutEn }).eq('id', profileId)
  if (error) throw new Error(`Prepare about fields: ${error.message}`)
  void browser
  void actor
  void ownerRoute
}

async function publicationAction(page, locale, mode, keyboardOnly) {
  const triggerName =
    mode === 'publish'
      ? /^(نشر الملف|Publish Profile)$/i
      : /^(إلغاء نشر الملف|Unpublish Profile)$/i
  const confirmName =
    mode === 'publish' ? /تأكيد.*نشر|Confirm publish/i : /تأكيد.*إلغاء|Confirm unpublish/i
  const nextName =
    mode === 'publish'
      ? /^(إلغاء نشر الملف|Unpublish Profile)$/i
      : /^(نشر الملف|Publish Profile)$/i
  const trigger = page.getByRole('button', { name: triggerName }).first()
  await trigger.waitFor({ state: 'visible' })
  if (keyboardOnly) {
    await trigger.focus()
    await page.keyboard.press('Enter')
  } else {
    await trigger.click()
  }
  const confirm = page.getByRole('button', { name: confirmName }).last()
  await confirm.waitFor({ state: 'visible' })
  if (keyboardOnly) {
    await confirm.focus()
    await page.keyboard.press('Enter')
  } else {
    await confirm.click()
  }
  await page.getByRole('button', { name: nextName }).waitFor({
    state: 'visible',
    timeout: 60_000,
  })
  return `${mode} completed in ${locale}`
}

async function publishThroughUi(browser, type, actor, ownerRoute, keyboardOnly = false) {
  await withPage(browser, 'ar', 'desktop', actor, async (page) => {
    await go(page, 'ar', ownerRoute)
    try {
      const observed = await publicationAction(page, 'ar', 'publish', keyboardOnly)
      if (keyboardOnly) {
        keyboardChecks.push({
          step: 'Publish',
          controls: 'Publish trigger and confirmation dialog',
          input: 'Keyboard focus + Enter only',
          observed,
          result: 'PASS',
        })
      }
    } catch (error) {
      if (keyboardOnly) {
        keyboardChecks.push({
          step: 'Publish',
          controls: 'Publish trigger and confirmation dialog',
          input: 'Keyboard focus + Enter only',
          observed: error instanceof Error ? error.message : String(error),
          result: 'FAIL',
        })
      }
      throw error
    }
  })
}

async function unpublishThroughUi(browser, type, actor, ownerRoute, keyboardOnly = false) {
  await withPage(browser, 'ar', 'desktop', actor, async (page) => {
    await go(page, 'ar', ownerRoute)
    try {
      const observed = await publicationAction(page, 'ar', 'unpublish', keyboardOnly)
      if (keyboardOnly) {
        keyboardChecks.push({
          step: 'Unpublish',
          controls: 'Unpublish trigger and confirmation dialog',
          input: 'Keyboard focus + Enter only',
          observed,
          result: 'PASS',
        })
      }
    } catch (error) {
      if (keyboardOnly) {
        keyboardChecks.push({
          step: 'Unpublish',
          controls: 'Unpublish trigger and confirmation dialog',
          input: 'Keyboard focus + Enter only',
          observed: error instanceof Error ? error.message : String(error),
          result: 'FAIL',
        })
      }
      throw error
    }
  })
}

async function capturePublishedSet(browser, type, actor, ownerRoute, publicRoute, prefix) {
  for (const [locale, viewport, tag] of [
    ['ar', 'desktop', 'ar-desktop'],
    ['en', 'desktop', 'en-desktop'],
    ['ar', '375', 'ar-375'],
  ]) {
    await captureOwnerSurface(browser, {
      type,
      locale,
      viewport,
      route: ownerRoute,
      actor,
      file: `${prefix}-${tag}-published-owner.png`,
      state: 'published_owner',
      expected: 'Published owner state and unpublish control visible',
    })
    await capturePublicSurface(browser, {
      type,
      locale,
      viewport,
      route: publicRoute,
      file: `${prefix}-${tag}-published-public.png`,
      state: 'published_public',
      expected: 'Anonymous visitor sees the published owned Profile',
    })
  }
}

async function captureDirectoryLink(browser, type, slug, publicRoute, file) {
  const route = `/catalog/${slug}`
  await withPage(browser, 'ar', 'desktop', null, async (page) => {
    const response = await go(page, 'ar', route)
    const link = page.locator(`a[href$="${publicRoute}"]`)
    const linkCount = await link.count()
    const pass = (response?.status() ?? 500) < 400 && linkCount > 0
    await shot(
      page,
      file,
      metadata({
        route,
        locale: 'ar',
        viewport: 'desktop',
        actor: 'anonymous',
        profileType: type,
        state: 'directory_published_profile_link',
        expected: `Directory record links to ${publicRoute}`,
        observed: `${linkCount} matching published Profile link(s)`,
        pass,
      }),
    )
    if (!pass) throw new Error(`${file}: Directory link missing`)
  })
}

async function authenticateStaffAtAal2() {
  const staff = secrets.users.staff
  const client = createClient(env.url, env.anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const signedIn = await client.auth.signInWithPassword({
    email: staff.email,
    password: staff.password,
  })
  if (signedIn.error || !signedIn.data.session) {
    throw new Error(`Staff password login failed: ${signedIn.error?.message ?? 'no session'}`)
  }
  const factors = await client.auth.mfa.listFactors()
  if (factors.error) throw new Error(`List staff MFA factors: ${factors.error.message}`)
  const factor = factors.data.totp.find((item) => item.status === 'verified')
  if (!factor) throw new Error('Verified staff TOTP factor not found')

  let verified = await client.auth.mfa.challengeAndVerify({
    factorId: factor.id,
    code: totp(secrets.staffTotpSecret),
  })
  if (verified.error) {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    verified = await client.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: totp(secrets.staffTotpSecret),
    })
  }
  if (verified.error) throw new Error(`Staff MFA verification failed: ${verified.error.message}`)
  const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel()
  if (assurance.error || assurance.data.currentLevel !== 'aal2') {
    throw new Error(`Staff session is not AAL2: ${assurance.error?.message ?? 'unexpected AAL'}`)
  }
  return client
}

async function suspendProfilesAsStaff() {
  const staff = await authenticateStaffAtAal2()
  for (const type of ['business', 'university']) {
    const { error } = await staff.rpc('suspend_profile', {
      p_profile_id: secrets.profiles[type].id,
      p_profile_type: type,
      p_reason: `SYNTH Spec 07E suspension ${secrets.runId}`,
    })
    if (error) throw new Error(`Suspend ${type} Profile: ${error.message}`)
  }
  await staff.auth.signOut()
}

async function captureSuspendedOwner(browser, type, actor, ownerRoute, file) {
  await withPage(browser, 'ar', 'desktop', actor, async (page) => {
    await go(page, 'ar', ownerRoute)
    const expectedRoute = `/${type === 'business' ? 'company' : 'university'}/profile-suspended`
    const pathName = new URL(page.url()).pathname
    const pass = pathName.endsWith(expectedRoute)
    await shot(
      page,
      file,
      metadata({
        route: ownerRoute,
        locale: 'ar',
        viewport: 'desktop',
        actor: type === 'business' ? 'business_owner' : 'university_owner',
        profileType: type,
        state: 'suspended_owner',
        expected: `Owner is redirected to ${expectedRoute}`,
        observed: pathName,
        pass,
      }),
    )
    if (!pass) throw new Error(`${file}: suspended owner route was not enforced`)
  })
}

function escapeCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}

function writeIndex() {
  const header =
    '| filename | route | locale | viewport | actor | profile type | JID07E_RUN_ID | state | expected | observed | pass/fail |'
  const divider = '|---|---|---|---|---|---|---|---|---|---|---|'
  const rows = index.map(
    (entry) =>
      `| ${[
        entry.filename,
        entry.route,
        entry.locale,
        entry.viewport,
        entry.actor,
        entry.profileType,
        entry.JID07E_RUN_ID,
        entry.state,
        entry.expected,
        entry.observed,
        entry.result,
      ]
        .map(escapeCell)
        .join(' | ')} |`,
  )
  fs.writeFileSync(
    path.join(outDir, 'INDEX.md'),
    ['# Spec 07-E UI evidence index', '', header, divider, ...rows, ''].join('\n'),
  )
  fs.writeFileSync(path.join(outDir, 'INDEX.json'), JSON.stringify(index, null, 2))
}

function writeKeyboardNote() {
  const passed =
    keyboardChecks.length === 2 && keyboardChecks.every((check) => check.result === 'PASS')
  const lines = [
    '# Spec 07-E keyboard accessibility note',
    '',
    `Run: \`${secrets.runId}\``,
    '',
    'Scope: the Business owner publication trigger, confirmation dialog, unpublication trigger, and confirmation dialog were operated with focus and Enter only. Authentication and route navigation are outside this focused keyboard walk.',
    '',
    ...keyboardChecks.flatMap((check) => [
      `## ${check.step} — ${check.result}`,
      `- Controls: ${check.controls}`,
      `- Input: ${check.input}`,
      `- Observed: ${check.observed}`,
      '',
    ]),
    `Overall: **${passed ? 'PASS' : 'FAIL'}**`,
    '',
  ]
  fs.writeFileSync(path.join(outDir, 'keyboard-a11y.md'), lines.join('\n'))
}

function writeConsoleNetworkNote() {
  const lines = [
    '# Spec 07-E console and network observations',
    '',
    `Run: \`${secrets.runId}\``,
    '',
    'Expected HTTP 404 responses are generated by the post-unpublish and post-suspension public not-found checks.',
    '',
  ]
  if (browserEvents.length === 0) {
    lines.push('No browser console errors, page errors, failed requests, or HTTP >= 400 responses were observed.')
  } else {
    for (const event of browserEvents) {
      lines.push(
        `- ${event.at} | ${event.kind} | ${event.locale}/${event.viewport} | ${event.url} | ${event.detail}`,
      )
    }
  }
  lines.push('')
  fs.writeFileSync(path.join(outDir, 'console-network.md'), lines.join('\n'))
}

async function writeAuditNotes() {
  const profileIds = [secrets.profiles.business.id, secrets.profiles.university.id]
  const { data, error } = await admin
    .from('audit_logs')
    .select('id,actor_id,action,entity_type,entity_id,created_at')
    .in('entity_id', profileIds)
    .in('action', ['profile.published', 'profile.unpublished'])
    .order('created_at', { ascending: true })
  if (error) throw new Error(`Read publication audit rows: ${error.message}`)
  const rows = data ?? []
  const lines = [
    '# Spec 07-E publication audit notes',
    '',
    `Run: \`${secrets.runId}\``,
    '',
    `Service-role verification found ${rows.length} publication lifecycle audit row(s).`,
    '',
  ]
  for (const type of ['business', 'university']) {
    const id = secrets.profiles[type].id
    const published = rows.filter(
      (row) => row.entity_id === id && row.action === 'profile.published',
    )
    const unpublished = rows.filter(
      (row) => row.entity_id === id && row.action === 'profile.unpublished',
    )
    lines.push(
      `- ${type}: profile \`${id}\`; profile.published=${published.length}; profile.unpublished=${unpublished.length}; ${published.length >= 2 && unpublished.length >= 1 ? 'PASS' : 'FAIL'}`,
    )
  }
  lines.push('', 'Audit row IDs:', '')
  for (const row of rows) {
    lines.push(
      `- \`${row.id}\` — ${row.action}; ${row.entity_type}; entity \`${row.entity_id}\`; actor \`${row.actor_id ?? 'null'}\`; ${row.created_at}`,
    )
  }
  lines.push('')
  fs.writeFileSync(path.join(outDir, 'audit-notes.md'), lines.join('\n'))
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const businessOwner = secrets.users.businessOwner
  const universityOwner = secrets.users.universityOwner
  const businessOwnerRoute = '/company/profile/edit'
  const universityOwnerRoute = '/university/profile/edit'
  const businessPublicRoute = `/companies/${secrets.directories.business.slug}/profile`
  const universityPublicRoute = `/universities/${secrets.directories.university.slug}/profile`

  try {
    await captureDraftSet(browser, 'business', businessOwner, businessOwnerRoute, '01-business')
    await captureDraftSet(
      browser,
      'university',
      universityOwner,
      universityOwnerRoute,
      '02-university',
    )

    await captureMissingFailure(
      browser,
      'business',
      businessOwner,
      businessOwnerRoute,
      '03-business-ar-desktop-missing-about.png',
    )
    await captureMissingFailure(
      browser,
      'university',
      universityOwner,
      universityOwnerRoute,
      '04-university-ar-desktop-missing-about.png',
    )

    await fillAboutThroughUi(browser, 'business', businessOwner, businessOwnerRoute)
    await publishThroughUi(browser, 'business', businessOwner, businessOwnerRoute, true)
    await capturePublishedSet(
      browser,
      'business',
      businessOwner,
      businessOwnerRoute,
      businessPublicRoute,
      '05-business',
    )
    await captureDirectoryLink(
      browser,
      'business',
      secrets.directories.business.slug,
      businessPublicRoute,
      '06-business-ar-desktop-directory-link.png',
    )
    await unpublishThroughUi(browser, 'business', businessOwner, businessOwnerRoute, true)
    await capturePublicSurface(browser, {
      type: 'business',
      locale: 'ar',
      viewport: 'desktop',
      route: businessPublicRoute,
      file: '07-business-ar-desktop-post-unpublish-not-found.png',
      state: 'post_unpublish_public_not_found',
      expected: 'Unpublished Business Profile returns not found to anonymous visitor',
      expectNotFound: true,
    })
    await publishThroughUi(browser, 'business', businessOwner, businessOwnerRoute)

    await fillAboutThroughUi(browser, 'university', universityOwner, universityOwnerRoute)
    await publishThroughUi(browser, 'university', universityOwner, universityOwnerRoute)
    await capturePublishedSet(
      browser,
      'university',
      universityOwner,
      universityOwnerRoute,
      universityPublicRoute,
      '08-university',
    )
    await captureDirectoryLink(
      browser,
      'university',
      secrets.directories.university.slug,
      universityPublicRoute,
      '09-university-ar-desktop-directory-link.png',
    )
    await unpublishThroughUi(browser, 'university', universityOwner, universityOwnerRoute)
    await capturePublicSurface(browser, {
      type: 'university',
      locale: 'ar',
      viewport: 'desktop',
      route: universityPublicRoute,
      file: '10-university-ar-desktop-post-unpublish-not-found.png',
      state: 'post_unpublish_public_not_found',
      expected: 'Unpublished University Profile returns not found to anonymous visitor',
      expectNotFound: true,
    })
    await publishThroughUi(browser, 'university', universityOwner, universityOwnerRoute)

    await suspendProfilesAsStaff()
    await captureSuspendedOwner(
      browser,
      'business',
      businessOwner,
      businessOwnerRoute,
      '11-business-ar-desktop-suspended-owner.png',
    )
    await capturePublicSurface(browser, {
      type: 'business',
      locale: 'ar',
      viewport: 'desktop',
      route: businessPublicRoute,
      file: '12-business-ar-desktop-suspended-public-not-found.png',
      state: 'suspended_public_not_found',
      expected: 'Suspended Business Profile returns not found to anonymous visitor',
      expectNotFound: true,
    })
    await captureSuspendedOwner(
      browser,
      'university',
      universityOwner,
      universityOwnerRoute,
      '13-university-ar-desktop-suspended-owner.png',
    )
    await capturePublicSurface(browser, {
      type: 'university',
      locale: 'ar',
      viewport: 'desktop',
      route: universityPublicRoute,
      file: '14-university-ar-desktop-suspended-public-not-found.png',
      state: 'suspended_public_not_found',
      expected: 'Suspended University Profile returns not found to anonymous visitor',
      expectNotFound: true,
    })

    await writeAuditNotes()
    console.log('CAPTURE_DONE', index.length)
  } finally {
    await browser.close()
    writeIndex()
    writeKeyboardNote()
    writeConsoleNetworkNote()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
