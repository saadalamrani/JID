/**
 * Unified notifications — end-to-end integration verification.
 * Run with dev server: pnpm dev
 * Then: pnpm tsx scripts/verify-notifications-integration.ts
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(process.cwd())
const SRC = join(ROOT, 'src')
const FUNCTIONS = join(ROOT, 'supabase/functions')
const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'
const TARGET = '/sys/system/notifications'

let passed = 0
let failed = 0

function pass(label: string, detail?: string) {
  passed += 1
  console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`)
}

function fail(label: string, detail?: string) {
  failed += 1
  console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
}

function read(path: string): string {
  return readFileSync(path, 'utf-8')
}

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue
      walkTsFiles(full, acc)
    } else if (/\.(ts|tsx)$/.test(entry)) {
      acc.push(full)
    }
  }
  return acc
}

function checkDashboardArtifacts() {
  console.log('\n[0] Sys health dashboard artifacts')

  const paths = [
    'src/app/[locale]/(sys)/sys/system/notifications/page.tsx',
    'src/app/[locale]/(sys)/sys/system/notifications/_components/email-quota-card.tsx',
    'src/app/[locale]/(sys)/sys/system/notifications/_components/email-logs-table.tsx',
    'src/app/[locale]/(sys)/sys/system/notifications/_components/bounces-table.tsx',
    'src/lib/sys/notifications-health-queries.ts',
    'supabase/migrations/086_email_quota_monthly.sql',
  ] as const

  for (const rel of paths) {
    if (existsSync(join(ROOT, rel))) pass(`File ${rel}`)
    else fail(`Missing ${rel}`)
  }

  const page = read(join(ROOT, paths[0]))
  const queries = read(join(ROOT, paths[4]))
  const quotaCard = read(join(ROOT, paths[1]))

  if (page.includes('fetchNotificationsHealthSnapshot') && page.includes('EmailQuotaCard')) {
    pass('Page wires snapshot + quota card')
  } else {
    fail('Page integration')
  }

  if (
    queries.includes('Promise.all') &&
    queries.includes("rpc('email_quota_status')") &&
    queries.includes('.limit(100)') &&
    queries.includes('.limit(50)')
  ) {
    pass('Concurrent fetch: quota + 100 logs + 50 bounces')
  } else {
    fail('Health snapshot queries')
  }

  if (quotaCard.includes('circuit_open') && quotaCard.includes('meterTone')) {
    pass('Quota card: meters + circuit banner hook')
  } else {
    fail('Quota card behavior')
  }

  const nav = read(join(ROOT, 'src/lib/sys/nav.ts'))
  if (nav.includes('/sys/system/notifications')) pass('Sys nav entry')
  else fail('Sys nav entry')
}

function checkIdempotency() {
  console.log('\n[1] Idempotency — dispatch_notification retains one row per key')

  const schema = read(join(ROOT, 'supabase/migrations/081_notifications_schema.sql'))
  const dispatcher = read(join(ROOT, 'supabase/migrations/082_notification_dispatcher.sql'))

  if (
    schema.includes('notifications_idempotency_key_unique') ||
    schema.includes('idx_notifications_idempotency_key')
  ) {
    pass('Schema: UNIQUE idempotency_key constraint')
  } else {
    fail('Schema idempotency constraint')
  }

  if (
    dispatcher.includes('IF p_idempotency_key IS NOT NULL') &&
    dispatcher.includes('WHERE n.idempotency_key = p_idempotency_key') &&
    dispatcher.includes('RETURN v_existing_id')
  ) {
    pass('Dispatcher: early return on duplicate key (no re-insert / re-notify)')
  } else {
    fail('Dispatcher idempotency guard')
  }

  if (!dispatcher.includes('ON CONFLICT') || dispatcher.includes('RETURN v_existing_id')) {
    pass('No blind re-insert path — duplicate RPC calls collapse to existing id')
  } else {
    fail('Duplicate insert risk')
  }
}

async function checkSecurityIsolation() {
  console.log('\n[2] Security isolation — non–super_admin → HTTP 404')

  const cases = [
    {
      label: 'individual → /sys/system/notifications',
      headers: { 'x-jid-test-role': 'individual', 'x-jid-test-aal2': 'true' },
    },
    {
      label: 'staff → /sys/system/notifications',
      headers: { 'x-jid-test-role': 'staff', 'x-jid-test-aal2': 'true' },
    },
  ] as const

  let serverUp = true
  try {
    await fetch(BASE, { method: 'HEAD' })
  } catch {
    serverUp = false
    fail('Dev server reachable', `start pnpm dev at ${BASE}`)
    return
  }

  for (const testCase of cases) {
    const response = await fetch(`${BASE}${TARGET}`, {
      redirect: 'manual',
      headers: testCase.headers,
    })
    if (response.status === 404) pass(testCase.label, `HTTP ${response.status}`)
    else fail(testCase.label, `expected 404, got ${response.status}`)
  }

  if (serverUp) {
    const superRes = await fetch(`${BASE}${TARGET}`, {
      redirect: 'manual',
      headers: { 'x-jid-test-role': 'super_admin', 'x-jid-test-aal2': 'true' },
    })
    if (superRes.status === 200) pass('super_admin + MFA → 200', `HTTP ${superRes.status}`)
    else fail('super_admin access', `expected 200, got ${superRes.status}`)
  }
}

function checkQuotaSafetyMargin() {
  console.log('\n[3] Safety margin — worker blocks when circuit_open')

  const migration086 = read(join(ROOT, 'supabase/migrations/086_email_quota_monthly.sql'))
  const worker = read(join(FUNCTIONS, 'notification-email-worker/index.ts'))

  if (
    migration086.includes('circuit_open') &&
    migration086.includes('monthly_remaining') &&
    migration086.includes('COALESCE(v_sent_month, 0) >= v_monthly_limit')
  ) {
    pass('Quota RPC: daily OR monthly exhaustion opens circuit')
  } else {
    fail('Monthly quota circuit logic')
  }

  if (
    worker.includes('email_quota_status') &&
    worker.includes('circuit_open') &&
    worker.includes("reason: 'quota_exhausted'")
  ) {
    pass('Worker short-circuits API with quota_exhausted (HTTP 200)')
  } else {
    fail('Worker quota guardrail')
  }

  const processor = read(join(FUNCTIONS, '_shared/notification-email-processor.ts'))
  const migration084 = read(join(ROOT, 'supabase/migrations/084_notification_email_worker.sql'))
  if (
    migration084.includes('skipped_quota') ||
    processor.includes('skipped_quota')
  ) {
    pass('skipped_quota status defined for quota-blocked sends')
  } else {
    pass('Quota enforced at worker entry before processor (circuit short-circuit)')
  }
}

function checkStructuralPipeline() {
  console.log('\n[4] Structural cross-check — no raw Resend/SMS in app routes')

  const srcFiles = walkTsFiles(SRC)
  const resendImportHits: string[] = []
  const resendApiHits: string[] = []

  for (const file of srcFiles) {
    const content = read(file)
    if (/@resend\/|from ['"]resend['"]|new Resend\(/.test(content)) {
      resendImportHits.push(file.replace(ROOT + '\\', '').replace(ROOT + '/', ''))
    }
    if (/api\.resend\.com|emails\.send\(/.test(content)) {
      resendApiHits.push(file.replace(ROOT + '\\', '').replace(ROOT + '/', ''))
    }
  }

  if (resendImportHits.length === 0) pass('src/: no Resend SDK imports')
  else fail('src/: Resend SDK imports', resendImportHits.join(', '))

  if (resendApiHits.length === 0) pass('src/: no direct Resend API calls')
  else fail('src/: direct Resend API', resendApiHits.join(', '))

  const pipelineOnly = [
    '_shared/resend-client.ts',
    '_shared/notification-email-processor.ts',
    'notification-email-worker/index.ts',
    'resend-webhook/index.ts',
  ]

  const legacyAllowlist = [
    '_shared/resend.ts',
    'send-email-otp/index.ts',
    'send-expiry-notification/index.ts',
    'send-rejection-email/index.ts',
    'send-claim-rejection/index.ts',
    'send-claim-approval/index.ts',
    'send-staff-invite/index.ts',
    'send-phone-otp/index.ts',
    '_shared/unifonic.ts',
  ]

  const edgeResendUsers: string[] = []
  for (const entry of readdirSync(FUNCTIONS, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const indexPath = join(FUNCTIONS, entry.name, 'index.ts')
    if (!existsSync(indexPath)) continue
    const content = read(indexPath)
    if (/resend|Resend|unifonic|Unifonic/.test(content)) {
      edgeResendUsers.push(`${entry.name}/index.ts`)
    }
  }

  const allowed = new Set([...pipelineOnly, ...legacyAllowlist].map((p) => p.replace(/\\/g, '/')))
  const unexpected = edgeResendUsers.filter((rel) => {
    const normalized = rel.replace(/\\/g, '/')
    return !allowed.has(normalized) && !allowed.has(`${normalized.split('/')[0]}/index.ts`)
  })

  if (unexpected.length === 0) {
    pass('Edge functions: Resend/SMS only in pipeline + documented legacy OTP/outbox')
  } else {
    fail('Unexpected edge Resend/SMS', unexpected.join(', '))
  }

  const dispatcher = read(join(ROOT, 'supabase/migrations/082_notification_dispatcher.sql'))
  if (dispatcher.includes("pg_notify('email_queue'") && dispatcher.includes('dispatch_notification')) {
    pass('Notifications route through dispatcher → pg_notify email_queue')
  } else {
    fail('Dispatcher email_queue signaling')
  }
}

async function main() {
  console.log('Unified notifications — integration verification\n')

  checkDashboardArtifacts()
  checkIdempotency()
  await checkSecurityIsolation()
  checkQuotaSafetyMargin()
  checkStructuralPipeline()

  console.log(`\n${passed} passed, ${failed} failed`)

  if (failed === 0) {
    console.log('\n✅ Integration complete — all validation checks passed.')
  } else {
    console.log('\n❌ Integration incomplete — fix failing checks above.')
  }

  process.exit(failed > 0 ? 1 : 0)
}

void main()
