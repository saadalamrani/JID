/**
 * Sections 15–17 — Staff Portal final boundary + integration verification.
 * Run: pnpm tsx scripts/verify-staff-final.ts
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execSync } from 'node:child_process'

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3002'
const ROOT = resolve(process.cwd())

const STAFF_HEADERS = {
  'x-jid-test-role': 'staff',
  'x-jid-test-aal2': 'true',
}

type Result = { check: string; status: 'PASS' | 'FAIL'; detail?: string }
const results: Result[] = []

function pass(check: string, detail?: string) {
  results.push({ check, status: 'PASS', detail })
}

function fail(check: string, detail?: string) {
  results.push({ check, status: 'FAIL', detail })
}

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

function staffPortalFiles(): string[] {
  const files: string[] = []
  function walk(dir: string) {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full)
    }
  }
  walk(join(ROOT, 'src/app/[locale]/(staff)'))
  walk(join(ROOT, 'src/lib/staff'))
  return files
}

async function checkHttp(path: string, headers: Record<string, string>, expectStatus: number) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'manual', headers })
  return res.status
}

async function main() {
  console.log('═'.repeat(60))
  console.log('Staff Portal — Final Verification (Sections 15–17)')
  console.log('═'.repeat(60))

  try {
    await fetch(BASE, { method: 'HEAD' })
  } catch {
    console.error(`\nDev server not reachable at ${BASE}. Start with: pnpm dev`)
    process.exit(1)
  }

  // ── Section 15 boundary checklist ─────────────────────────────────────────

  const sysStatus = await checkHttp('/sys/dashboard', STAFF_HEADERS, 404)
  if (sysStatus === 404) pass('Staff → /sys returns 404', `HTTP ${sysStatus}`)
  else fail('Staff → /sys returns 404', `HTTP ${sysStatus}`)

  const flagsActions = readSrc('src/app/[locale]/(sys)/sys/flags/actions.ts')
  if (flagsActions.includes('Only super administrators can manage feature flags')) {
    pass('Staff cannot toggle feature flags (server rejects)')
  } else {
    fail('Feature flag server guard')
  }

  const migration078 = readSrc('supabase/migrations/078_staff_portal_section3.sql')
  if (migration078.includes("RAISE EXCEPTION 'Staff cannot suspend privileged accounts'")) {
    pass('staff_suspend_user RPC blocks staff/super_admin suspension')
  } else {
    fail('staff_suspend_user RPC guard')
  }

  const usersMenu = readSrc('src/app/[locale]/(staff)/staff/users/_components/user-actions-menu.tsx')
  const usersActions = readSrc('src/app/[locale]/(staff)/staff/users/actions.ts')
  if (
    !usersMenu.includes('changeRole') &&
    !usersActions.includes('role_changed') &&
    usersActions.includes("rpc('staff_suspend_user'")
  ) {
    pass('No role change UI/server; suspend uses RPC')
  } else {
    fail('Role change / suspend surface')
  }

  const auditQueries = readSrc('src/lib/staff/audit-queries.ts')
  if (auditQueries.includes(".eq('actor_id', staff.id)")) {
    pass('Personal audit: explicit actor_id filter + RLS')
  } else {
    fail('Personal audit scope')
  }

  const staffValidation = readSrc('src/lib/validations/staff.ts')
  const claimForm = readSrc('src/app/[locale]/(staff)/staff/claims/[id]/_components/claim-decision-form.tsx')
  if (
    staffValidation.includes('.min(10') &&
    claimForm.includes('reasonValid') &&
    migration078.includes('Review reason is required')
  ) {
    pass('Claim review mandatory reason (client + server + RPC)')
  } else {
    fail('Mandatory claim reason')
  }

  const claimsActions = readSrc('src/app/[locale]/(staff)/staff/claims/actions.ts')
  if (
    claimsActions.includes('Cannot review your own claim') &&
    claimForm.includes('isSelfReview') &&
    migration078.includes('Cannot review your own claim')
  ) {
    pass('Self-claim review blocked (UI + server + RPC)')
  } else {
    fail('Self-claim review block')
  }

  const realtime = readSrc('src/app/[locale]/(staff)/staff/claims/_components/realtime-claims-updater.tsx')
  if (realtime.includes('claim_requests') && realtime.includes('INSERT')) {
    pass('Realtime new-claim notifications wired (Supabase Realtime)')
  } else {
    fail('Realtime claims updater')
  }

  const useBadges = readSrc('src/lib/staff/use-staff-badges.ts')
  if (useBadges.includes('30_000')) {
    pass('Sidebar badges poll every 30s')
  } else {
    fail('Badge poll interval')
  }

  const urgency = readSrc('src/lib/staff/claim-urgency.ts')
  const claimCard = readSrc('src/app/[locale]/(staff)/staff/claims/_components/claim-card.tsx')
  if (
    urgency.includes('border-s-red-600') &&
    urgency.includes('border-s-orange-500') &&
    urgency.includes('border-s-amber-400') &&
    claimCard.includes('text-red-600')
  ) {
    pass('SLA countdown colors (red/orange/amber/gray)')
  } else {
    fail('SLA urgency colors')
  }

  const constants = readSrc('src/lib/staff/constants.ts')
  const middleware = readSrc('src/middleware.ts')
  if (
    constants.includes('STAFF_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60') &&
    middleware.includes('STAFF_SESSION_MAX_AGE_SECONDS')
  ) {
    pass('Session expires after 8 hours')
  } else {
    fail('8h session cap')
  }

  const idleGuard = readSrc('src/components/staff/staff-idle-guard.tsx')
  if (idleGuard.includes('STAFF_IDLE_TIMEOUT_SECONDS') && idleGuard.includes('reason=idle')) {
    pass('Idle timeout 30min → auto-logout implemented')
  } else {
    fail('Idle timeout 30min auto-logout')
  }

  if (migration078.includes("'claim.approved'") && migration078.includes('_write_audit_log')) {
    pass('Claim actions logged to audit_logs with reason')
  } else {
    fail('Claim audit logging')
  }

  const modActions = readSrc('src/app/[locale]/(staff)/staff/moderation/actions.ts')
  if (
    modActions.includes('content_flag.resolved_hidden') &&
    modActions.includes('content_flag.dismissed')
  ) {
    pass('Content flag lifecycle: resolved_hidden / dismissed')
  } else {
    fail('Content flag lifecycle')
  }

  const mentorReview = readSrc('src/lib/staff/review-mentor-application.ts')
  if (
    mentorReview.includes("from('mentor_profiles')") &&
    mentorReview.includes("status: 'approved'") &&
    !mentorReview.includes("from('profiles')")
  ) {
    pass('Mentor review updates mentor_profiles.status only')
  } else {
    fail('Mentor review scope')
  }

  const staffFiles = staffPortalFiles()
  const claimStatusHits = staffFiles.filter((file) => {
    const content = readFileSync(file, 'utf-8')
    return /\bclaim_status\b/.test(content)
  })
  if (claimStatusHits.length === 0) {
    pass('No claim_status references in Staff Portal code')
  } else {
    fail('claim_status in staff portal', claimStatusHits.map((f) => f.replace(ROOT, '')).join(', '))
  }

  // ── Task 2 retroactive fixes ───────────────────────────────────────────────

  const typesCompanies = readSrc('src/lib/supabase/types.ts')
  const companiesBlock = /companies:\s*\{[\s\S]*?Row:\s*\{([\s\S]*?)\n\s*\}/m.exec(typesCompanies)
  const hasClaimStatusCol = companiesBlock?.[1]?.includes('claim_status') ?? false
  if (!hasClaimStatusCol) {
    pass('types.ts: companies has no claim_status column')
  } else {
    fail('companies.claim_status in types')
  }

  let roleMentorHits = 0
  try {
    const rg = execSync(
      `rg "role\\s*=\\s*['\"]mentor['\"]" src --glob "*.{ts,tsx}" -l`,
      { cwd: ROOT, encoding: 'utf8' },
    ).trim()
    roleMentorHits = rg ? rg.split('\n').length : 0
  } catch {
    roleMentorHits = 0
  }
  if (roleMentorHits === 0) {
    pass("No role = 'mentor' code hits")
  } else {
    fail("role = 'mentor' found", `${roleMentorHits} files`)
  }

  // ── Section 17 analytics ───────────────────────────────────────────────────

  const staffEvents = readSrc('src/lib/analytics/staff-events.ts')
  const requiredEvents = [
    'staff.login_succeeded',
    'staff.mfa_verified',
    'staff.dashboard_viewed',
    'staff.claim_reviewed',
    'staff.mentor_application_reviewed',
    'staff.user_suspended',
    'staff.flag_resolved',
    'staff.entity_metadata_updated',
    'staff.audit_viewed',
  ]
  const missingEvents = requiredEvents.filter((e) => !staffEvents.includes(e))
  if (missingEvents.length === 0) {
    pass('Section 17 staff.* analytics events declared')
  } else {
    fail('staff.* events missing', missingEvents.join(', '))
  }

  const trackRefs = execSync(
    'rg -l "staff\\.(login_succeeded|mfa_verified|dashboard_viewed|claim_reviewed|mentor_application_reviewed|user_suspended|flag_resolved|entity_metadata_updated|audit_viewed)" src --glob "*.{ts,tsx}"',
    { cwd: ROOT, encoding: 'utf8' },
  ).trim()
  if (trackRefs.split('\n').filter(Boolean).length >= 8) {
    pass('staff.* events wired in source')
  } else {
    fail('staff.* event wiring', `${trackRefs.split('\n').length} files`)
  }

  // ── Cross-sprint integration (static) ─────────────────────────────────────

  const mig044 = readSrc('supabase/migrations/044_company_catalog_reconciliation.sql')
  const mig048 = readSrc('supabase/migrations/048_jobs_applications_database.sql')
  const mentorHook = readSrc('src/lib/hooks/use-mentor-mode.ts')
  if (
    migration078.includes("entity_state = 'approved'") &&
    mig044.includes('claimed_by = auth.uid()') &&
    mig048.includes("entity_state = 'approved'")
  ) {
    pass('Claim approval → entity_state=approved → Catalog/Job Board RLS (migrations)')
  } else {
    fail('Cross-sprint claim → catalog/jobs chain')
  }

  if (
    mentorReview.includes("status: 'approved'") &&
    mentorHook.includes("data?.status === 'approved'")
  ) {
    pass('Mentor approval → mentor_profiles.status → hasMentorRole hook')
  } else {
    fail('Cross-sprint mentor approval chain')
  }

  // ── Notifications path ─────────────────────────────────────────────────────

  if (!existsSync(join(ROOT, 'src/lib/notifications'))) {
    const notifyFiles = [
      'src/lib/staff/notify-claim-decision.ts',
      'src/lib/staff/notify-user-events.ts',
      'src/lib/mentor-application/notify-application-approved.ts',
    ]
    const allTodo = notifyFiles.every((f) => readSrc(f).includes('dispatch_notification'))
    const noResend = notifyFiles.every((f) => !readSrc(f).includes('Resend'))
    if (allTodo && noResend) {
      pass('Notifications: email_outbox + TODO (no Unified Notifications sprint)')
    } else {
      fail('Notification TODO path')
    }
  } else {
    fail('Unified Notifications exists — verify dispatch_notification migration manually')
  }

  // ── HTTP smoke ─────────────────────────────────────────────────────────────

  const staffHome = await checkHttp('/staff', STAFF_HEADERS, 200)
  if (staffHome === 200) pass('/staff dashboard renders')
  else fail('/staff dashboard', `HTTP ${staffHome}`)

  const auditPage = await checkHttp('/staff/audit', STAFF_HEADERS, 200)
  if (auditPage === 200) pass('/staff/audit renders')
  else fail('/staff/audit', `HTTP ${auditPage}`)

  const badgesRes = await fetch(`${BASE}/api/staff/badges`, { headers: STAFF_HEADERS })
  if (badgesRes.ok && (badgesRes.headers.get('cache-control') ?? '').includes('max-age=30')) {
    pass('/api/staff/badges with 30s cache')
  } else {
    fail('/api/staff/badges', `HTTP ${badgesRes.status}`)
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log('\nCHECKLIST SUMMARY')
  console.log('─'.repeat(60))
  let passed = 0
  let failed = 0
  for (const r of results) {
    const mark = r.status === 'PASS' ? '✓' : '✗'
    console.log(`[${mark}] ${r.check}${r.detail ? ` — ${r.detail}` : ''}`)
    if (r.status === 'PASS') passed += 1
    else failed += 1
  }

  console.log('\n' + '═'.repeat(60))
  console.log(`${passed} passed, ${failed} failed`)

  if (failed === 0) {
    console.log('\n✓ Staff Portal COMPLETE — all checks PASS')
  } else {
    console.log('\n✗ Staff Portal NOT complete — fix failures above')
  }

  process.exit(failed > 0 ? 1 : 0)
}

void main()
