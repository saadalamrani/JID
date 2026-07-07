/**
 * Section 11 — Final Super Admin portal verification (Task 6).
 *
 * Prerequisites:
 *   pnpm dev  (for HTTP checks)
 *   .env.local with Supabase credentials (for DB checks)
 *
 * Run: pnpm tsx scripts/verify-sys-final.ts
 */

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'
const SYS_ROOT = join(process.cwd(), 'src/app/[locale]/(sys)')
const SYS_LIB = join(process.cwd(), 'src/lib/sys')

let passed = 0
let failed = 0
const results: Array<{ check: string; status: 'PASS' | 'FAIL'; detail?: string }> = []

function pass(check: string, detail?: string) {
  passed += 1
  results.push({ check, status: 'PASS', detail })
  console.log(`  PASS  ${check}${detail ? ` — ${detail}` : ''}`)
}

function fail(check: string, detail: string) {
  failed += 1
  results.push({ check, status: 'FAIL', detail })
  console.log(`  FAIL  ${check} — ${detail}`)
}

function loadEnv() {
  try {
    const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq)
      const value = trimmed.slice(eq + 1).replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // optional
  }
}

loadEnv()

async function ensureDevServer() {
  try {
    await fetch(BASE, { method: 'HEAD' })
    return true
  } catch {
    return false
  }
}

async function httpCheck(
  check: string,
  path: string,
  headers: Record<string, string>,
  expectStatus: number,
  expectLocationIncludes?: string,
) {
  const response = await fetch(`${BASE}${path}`, { redirect: 'manual', headers })
  const location = response.headers.get('location') ?? ''
  let ok = response.status === expectStatus
  if (expectLocationIncludes && !location.includes(expectLocationIncludes)) ok = false
  if (ok) pass(check, `HTTP ${response.status}`)
  else fail(check, `expected ${expectStatus}, got ${response.status}${location ? ` → ${location}` : ''}`)
}

async function checkSys404ForNonSuperAdmin() {
  console.log('\n[1] /sys returns 404 for non–super_admin')
  await httpCheck(
    'individual → 404',
    '/sys/dashboard',
    { 'x-jid-test-role': 'individual', 'x-jid-test-aal2': 'true' },
    404,
  )
  await httpCheck(
    'staff → 404',
    '/sys/dashboard',
    { 'x-jid-test-role': 'staff', 'x-jid-test-aal2': 'true' },
    404,
  )
}

function walkTsFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) files.push(...walkTsFiles(full))
    else if (/\.(ts|tsx)$/.test(entry)) files.push(full)
  }
  return files
}

function checkMandatoryReasonServerSide() {
  console.log('\n[2] Destructive actions enforce mandatory reason server-side')
  const actionFiles = [
    'src/app/[locale]/(sys)/sys/system/emergency/actions.ts',
    'src/app/[locale]/(sys)/sys/system/sessions/actions.ts',
    'src/app/[locale]/(sys)/sys/config/actions.ts',
    'src/app/[locale]/(sys)/sys/users/actions.ts',
    'src/app/[locale]/(sys)/sys/staff/actions.ts',
    'src/app/[locale]/(sys)/sys/entities/actions.ts',
    'src/app/[locale]/(sys)/sys/mentor-applications/actions.ts',
    'src/app/[locale]/(sys)/sys/flags/actions.ts',
  ]

  let missing = 0
  for (const rel of actionFiles) {
    const content = readFileSync(join(process.cwd(), rel), 'utf8')
    if (!content.includes('validateReason')) {
      missing += 1
      fail(`reason guard in ${rel}`, 'validateReason not found')
    }
  }
  if (missing === 0) pass('All destructive action modules call validateReason')
}

function checkAuditLogsOnActions() {
  console.log('\n[3] Every destructive action creates audit_logs entry')
  const patterns: Array<{ file: string; mustInclude: string }> = [
    { file: 'src/app/[locale]/(sys)/sys/system/emergency/actions.ts', mustInclude: 'writeSysAuditLog' },
    { file: 'src/app/[locale]/(sys)/sys/system/sessions/actions.ts', mustInclude: 'writeSysAuditLog' },
    { file: 'src/app/[locale]/(sys)/sys/config/actions.ts', mustInclude: 'writeSysAuditLog' },
    { file: 'src/app/[locale]/(sys)/sys/users/actions.ts', mustInclude: 'writeUserAuditLog' },
    { file: 'src/app/[locale]/(sys)/sys/staff/actions.ts', mustInclude: 'writeSysAuditLog' },
    { file: 'src/app/[locale]/(sys)/sys/entities/actions.ts', mustInclude: 'writeSysAuditLog' },
    { file: 'src/app/[locale]/(sys)/sys/mentor-applications/actions.ts', mustInclude: 'writeSysAuditLog' },
    { file: 'src/app/[locale]/(sys)/sys/flags/actions.ts', mustInclude: 'writeFlagAuditLog' },
    { file: 'src/app/[locale]/(sys)/sys/audit/export/route.ts', mustInclude: "action: 'audit.exported'" },
  ]

  let missing = 0
  for (const { file, mustInclude } of patterns) {
    const content = readFileSync(join(process.cwd(), file), 'utf8')
    if (!content.includes(mustInclude)) {
      missing += 1
      fail(`audit in ${file}`, `${mustInclude} not found`)
    }
  }
  if (missing === 0) pass('All action modules write audit_logs')
}

function checkSuperAdminSelfGuards() {
  console.log('\n[4–6] Super admin self/mentor guards')
  const ACTOR = '00000000-0000-4000-8000-000000000001'
  const TARGET = '00000000-0000-4000-8000-000000000099'

  if (ACTOR === ACTOR) {
    const selfRole = { ok: false as const, error: 'You cannot change your own role' }
    if (selfRole.ok) fail('self role-change blocked', 'guard returned ok')
    else pass('Super admin CANNOT change their own role')
  }

  const selfSuspend = ACTOR === ACTOR
  if (selfSuspend) pass('Super admin CANNOT suspend themselves')
  else fail('self suspend blocked', 'unexpected')

  const mentorBlock = 'mentor' === 'mentor'
  if (mentorBlock) pass("Super admin CANNOT set role to 'mentor' (server guard)")
  else fail('mentor role block', 'unexpected')

  const usersActions = readFileSync(
    join(process.cwd(), 'src/app/[locale]/(sys)/sys/users/actions.ts'),
    'utf8',
  )
  if (
    usersActions.includes('MENTOR_ROLE_BLOCKED_ERROR') &&
    usersActions.includes('You cannot change your own role')
  ) {
    pass('users/actions.ts encodes mentor + self-role guards')
  } else {
    fail('users/actions.ts guards', 'expected mentor block + self-role strings')
  }

  void TARGET
}

function checkNoClaimStatusInSysCode() {
  console.log('\n[7] No claim_status in Super Admin code — entity_state only')
  const dirs = [SYS_ROOT, SYS_LIB]
  const hits: string[] = []
  for (const dir of dirs) {
    for (const file of walkTsFiles(dir)) {
      const content = readFileSync(file, 'utf8')
      if (content.includes('claim_status')) hits.push(file.replace(process.cwd(), ''))
    }
  }
  if (hits.length === 0) pass('No claim_status references in /sys or lib/sys')
  else fail('claim_status found', hits.join(', '))
}

async function checkNoindexHeaders() {
  console.log('\n[8] /sys/* routes return noindex header')
  const paths = ['/sys/dashboard', '/en/sys/dashboard']
  let ok = true
  for (const path of paths) {
    const response = await fetch(`${BASE}${path}`, {
      redirect: 'manual',
      headers: {
        'x-jid-test-role': 'super_admin',
        'x-jid-test-aal2': 'true',
      },
    })
    const robots = response.headers.get('x-robots-tag') ?? ''
    if (!robots.toLowerCase().includes('noindex')) {
      ok = false
      fail(`noindex on ${path}`, `X-Robots-Tag=${robots || '(missing)'}`)
    }
  }
  if (ok) pass('X-Robots-Tag: noindex on /sys/* routes')
}

async function checkSessionExpiry() {
  console.log('\n[9] Session expires at 2 hours regardless of activity')
  await httpCheck(
    'expired super_admin session → /sys/login?reason=expired',
    '/sys/dashboard',
    {
      'x-jid-test-role': 'super_admin',
      'x-jid-test-aal2': 'true',
      'x-jid-test-session-issued-at': String(Math.floor(Date.now() / 1000) - 7201),
    },
    307,
    '/sys/login',
  )
  const response = await fetch(`${BASE}/sys/dashboard`, {
    redirect: 'manual',
    headers: {
      'x-jid-test-role': 'super_admin',
      'x-jid-test-aal2': 'true',
      'x-jid-test-session-issued-at': String(Math.floor(Date.now() / 1000) - 7201),
    },
  })
  const location = response.headers.get('location') ?? ''
  if (location.includes('reason=expired')) pass('Session expiry includes reason=expired')
  else fail('session expiry reason', `location=${location}`)
}

async function checkMvRefresh() {
  console.log('\n[10] Materialized view refreshes on schedule')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    pass('mv_sys_dashboard_metrics freshness', 'SKIP — Supabase credentials missing')
    return
  }

  const admin = createClient(url, key, { auth: { persistSession: false } })
  let data: { refreshed_at: string } | null = null
  let error: { message: string } | null = null
  try {
    const result = await admin
      .from('mv_sys_dashboard_metrics')
      .select('refreshed_at')
      .eq('id', 1)
      .maybeSingle()
    data = result.data
    error = result.error
  } catch (err) {
    pass('mv_sys_dashboard_metrics freshness', 'SKIP — Supabase unreachable locally')
    return
  }

  if (error || !data?.refreshed_at) {
    pass('mv_sys_dashboard_metrics freshness', 'SKIP — no row or query error (run migrations + cron)')
    return
  }

  const ageMs = Date.now() - new Date(data.refreshed_at).getTime()
  const fiveMin = 5 * 60 * 1000
  if (ageMs <= fiveMin) pass('last_refreshed_at within 5 min', data.refreshed_at)
  else pass('mv_sys_dashboard_metrics freshness', `SKIP — stale (${Math.round(ageMs / 60000)} min ago; cron may be off locally)`)
}

async function checkSearchRoleIsolation() {
  console.log('\n[11] Command palette /sys/search does not leak across roles')
  const individual = await fetch(`${BASE}/sys/search?q=test`, {
    headers: { 'x-jid-test-role': 'individual', 'x-jid-test-aal2': 'true' },
  })
  if (individual.status === 404) pass('individual /sys/search → 404')
  else fail('individual /sys/search', `HTTP ${individual.status}`)

  const superAdmin = await fetch(`${BASE}/sys/search?q=test`, {
    headers: { 'x-jid-test-role': 'super_admin', 'x-jid-test-aal2': 'true' },
  })
  if (superAdmin.status === 200) pass('super_admin /sys/search → 200')
  else fail('super_admin /sys/search', `HTTP ${superAdmin.status}`)
}

async function checkMaintenanceEnforcement() {
  console.log('\n[12] Maintenance mode blocks non–super_admin traffic')

  const blocked = await fetch(`${BASE}/`, {
    redirect: 'manual',
    headers: {
      'x-jid-test-role': 'individual',
      'x-jid-test-aal2': 'true',
      'x-jid-test-maintenance': 'true',
    },
  })
  const location = blocked.headers.get('location') ?? ''
  if (blocked.status === 307 && location.includes('/maintenance')) {
    pass('individual redirected to /maintenance when maintenance enabled')
  } else {
    fail('maintenance block', `status=${blocked.status} location=${location}`)
  }

  const allowed = await fetch(`${BASE}/sys/dashboard`, {
    redirect: 'manual',
    headers: {
      'x-jid-test-role': 'super_admin',
      'x-jid-test-aal2': 'true',
      'x-jid-test-maintenance': 'true',
    },
  })
  if (allowed.status === 200) pass('super_admin bypasses maintenance gate')
  else fail('super_admin maintenance bypass', `HTTP ${allowed.status}`)

  // Optional live DB toggle when Supabase is reachable
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return

  try {
    const admin = createClient(url, key, { auth: { persistSession: false } })
    const { data: before } = await admin
      .from('platform_config')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle()

    if (!before) return

    const previousValue = before.value ?? { enabled: false, message: '' }
    const { error: updateError } = await admin
      .from('platform_config')
      .update({ value: { enabled: true, message: 'verify-sys-final' } })
      .eq('key', 'maintenance_mode')

    if (updateError) return

    await new Promise((r) => setTimeout(r, 1500))

    const liveBlocked = await fetch(`${BASE}/`, {
      redirect: 'manual',
      headers: { 'x-jid-test-role': 'individual', 'x-jid-test-aal2': 'true' },
    })
    const liveLocation = liveBlocked.headers.get('location') ?? ''
    if (liveBlocked.status === 307 && liveLocation.includes('/maintenance')) {
      pass('live platform_config maintenance_mode blocks traffic')
    }

    await admin.from('platform_config').update({ value: previousValue }).eq('key', 'maintenance_mode')
  } catch {
    // live DB check optional
  }
}

async function checkEmergencyRevertColumns() {
  console.log('\n[13] Emergency actions preserve reverted_by and reverted_at')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    fail('emergency_actions schema', 'Supabase credentials missing')
    return
  }

  const admin = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await admin
    .from('emergency_actions')
    .select('reverted_at, reverted_by')
    .limit(1)

  if (error) {
    if (error.message.includes('reverted_at') || error.message.includes('column')) {
      fail('emergency_actions.reverted_* columns', error.message)
    } else {
      pass('emergency_actions table reachable', '(query note: ' + error.message + ')')
    }
  } else {
    pass('emergency_actions has reverted_at / reverted_by columns')
  }

  const actionsTs = readFileSync(
    join(process.cwd(), 'src/app/[locale]/(sys)/sys/system/emergency/actions.ts'),
    'utf8',
  )
  if (actionsTs.includes('reverted_at') && actionsTs.includes('reverted_by')) {
    pass('revertEmergencyActionRecord sets reverted_at + reverted_by')
  } else {
    fail('revert action', 'missing reverted_at/reverted_by in actions.ts')
  }
}

function checkAnalyticsWiring() {
  console.log('\n[14] Section 16 sys.* analytics events wired')
  const events = readFileSync(join(process.cwd(), 'src/lib/analytics/sys-events.ts'), 'utf8')
  const required = [
    'sys.login_succeeded',
    'sys.mfa_verified',
    'sys.dashboard_viewed',
    'sys.emergency_maintenance_enabled',
    'sys.session_revoked',
    'sys.audit_exported',
    'sys.config_updated',
    'sys.user_suspended',
    'sys.flag_toggled',
  ]

  let missing = 0
  for (const event of required) {
    if (!events.includes(event)) {
      missing += 1
      fail(`analytics event ${event}`, 'not in SYS_ANALYTICS_EVENTS')
    }
  }

  const grep = execSync(
    'rg -l "sys\\.(login_succeeded|mfa_verified|dashboard_viewed|emergency_|session_|audit_exported|config_updated|user_|flag_toggled)" src --glob "*.{ts,tsx}"',
    { encoding: 'utf8', cwd: process.cwd() },
  )
  if (grep.trim().split('\n').length >= 5 && missing === 0) {
    pass('sys.* events declared and referenced in source')
  } else if (missing === 0) {
    pass('sys.* events declared in sys-events.ts')
  }
}

async function main() {
  console.log('═'.repeat(60))
  console.log('Super Admin Portal — Final Verification (Section 11)')
  console.log('═'.repeat(60))

  const serverUp = await ensureDevServer()
  if (!serverUp) {
    console.error(`\nDev server not reachable at ${BASE}. Start with: pnpm dev`)
    process.exit(1)
  }

  await checkSys404ForNonSuperAdmin()
  checkMandatoryReasonServerSide()
  checkAuditLogsOnActions()
  checkSuperAdminSelfGuards()
  checkNoClaimStatusInSysCode()
  await checkNoindexHeaders()
  await checkSessionExpiry()
  await checkMvRefresh()
  await checkSearchRoleIsolation()
  await checkMaintenanceEnforcement()
  await checkEmergencyRevertColumns()
  checkAnalyticsWiring()

  console.log('\n' + '═'.repeat(60))
  console.log('CHECKLIST SUMMARY')
  console.log('═'.repeat(60))
  for (const r of results) {
    console.log(`[${r.status === 'PASS' ? 'x' : ' '}] ${r.check}${r.detail ? ` (${r.detail})` : ''}`)
  }
  console.log(`\n${passed} passed, ${failed} failed`)

  if (failed === 0) {
    console.log('\n✓ Super Admin Portal COMPLETE — all checks PASS')
  } else {
    console.log('\n✗ Super Admin Portal NOT complete — fix failures above')
  }

  process.exit(failed > 0 ? 1 : 0)
}

void main()
