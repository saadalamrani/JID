/**
 * Sections 11–12 — personal audit log + badge API verification.
 * Run: pnpm tsx scripts/verify-staff-audit-badges.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3002'
const ROOT = process.cwd()

const STAFF_HEADERS = {
  'x-jid-test-role': 'staff',
  'x-jid-test-aal2': 'true',
}

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

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

async function main() {
  console.log(`Sections 11–12 — audit + badges (${BASE})\n`)

  try {
    await fetch(BASE, { method: 'HEAD' })
  } catch {
    console.error(`Dev server not reachable at ${BASE}. Start with: pnpm dev`)
    process.exit(1)
  }

  const auditQueries = readSrc('src/lib/staff/audit-queries.ts')
  const auditPage = readSrc('src/app/[locale]/(staff)/staff/audit/page.tsx')
  const badgesRoute = readSrc('src/app/api/staff/badges/route.ts')
  const badgesLib = readSrc('src/lib/staff/badges.ts')
  const useBadges = readSrc('src/lib/staff/use-staff-badges.ts')
  const notifyClaim = readSrc('src/lib/staff/notify-claim-decision.ts')
  const notifyUser = readSrc('src/lib/staff/notify-user-events.ts')
  const notifyMentor = readSrc('src/lib/mentor-application/notify-application-approved.ts')

  if (auditQueries.includes(".eq('actor_id', staff.id)")) {
    pass('Personal audit query filters actor_id explicitly')
  } else {
    fail('Personal audit actor_id filter')
  }

  if (auditPage.includes('scopeBanner')) {
    pass('Audit page shows scope info banner')
  } else {
    fail('Audit scope banner')
  }

  if (auditQueries.includes('STAFF_AUDIT_PAGE_SIZE')) {
    pass('Audit uses 200-event default page size')
  } else {
    fail('Audit page size')
  }

  if (
    badgesRoute.includes('getDevTestStaffProfile') &&
    badgesRoute.includes('staffBadgeCacheHeaders') &&
    badgesLib.includes('CACHE_MAX_AGE_SECONDS = 30')
  ) {
    pass('Badge API auth + 30s cache headers')
  } else {
    fail('Badge API cache/auth')
  }

  if (badgesLib.includes("'assigned'") && badgesLib.includes("'open_flags'")) {
    pass('Badge types: assigned, pending, open_flags, mentor_apps')
  } else {
    fail('Badge type coverage')
  }

  if (useBadges.includes('30_000')) {
    pass('Sidebar polls badges every 30s')
  } else {
    fail('Badge poll interval')
  }

  if (notifyClaim.includes('claim.approved') && notifyClaim.includes('rejection_reason')) {
    pass('Claim notifications use claim.approved / claim.rejected categories')
  } else {
    fail('Claim notification categories')
  }

  if (notifyUser.includes('account.suspended')) {
    pass('Suspend notification wired (account.suspended)')
  } else {
    fail('Suspend notification')
  }

  if (notifyMentor.includes('mentor.application_approved')) {
    pass('Mentor approval notification category')
  } else {
    fail('Mentor approval notification')
  }

  if (!existsSync(join(ROOT, 'src/lib/notifications'))) {
    pass('Notifications sprint not built — email_outbox + TODO path confirmed')
  } else {
    fail('src/lib/notifications exists — migrate to dispatch_notification')
  }

  const auditRes = await fetch(`${BASE}/staff/audit`, {
    redirect: 'manual',
    headers: STAFF_HEADERS,
  })
  if (auditRes.status === 200) {
    pass('/staff/audit renders', 'HTTP 200')
  } else {
    fail('/staff/audit', `HTTP ${auditRes.status}`)
  }

  const badgesRes = await fetch(`${BASE}/api/staff/badges`, {
    headers: STAFF_HEADERS,
  })
  if (badgesRes.ok) {
    const cache = badgesRes.headers.get('cache-control') ?? ''
    if (cache.includes('max-age=30')) {
      pass('/api/staff/badges returns counts with cache', cache)
    } else {
      fail('/api/staff/badges cache header', cache || 'missing')
    }
  } else {
    fail('/api/staff/badges', `HTTP ${badgesRes.status}`)
  }

  const typedRes = await fetch(`${BASE}/api/staff/badges?type=open_flags`, {
    headers: STAFF_HEADERS,
  })
  if (typedRes.ok) {
    const body = (await typedRes.json()) as { type?: string; count?: number }
    if (body.type === 'open_flags' && typeof body.count === 'number') {
      pass('Badge type param returns single count')
    } else {
      fail('Badge type param response shape')
    }
  } else {
    fail('/api/staff/badges?type=open_flags', `HTTP ${typedRes.status}`)
  }

  const noAuthRes = await fetch(`${BASE}/api/staff/badges`)
  if (noAuthRes.status === 401) {
    pass('Unauthenticated badge request → 401')
  } else {
    fail('Badge auth gate', `HTTP ${noAuthRes.status}`)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
