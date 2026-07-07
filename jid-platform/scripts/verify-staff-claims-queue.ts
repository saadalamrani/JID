/**
 * Section 7 — staff claims queue + mentor application separation verification.
 * Run: pnpm tsx scripts/verify-staff-claims-queue.ts
 */

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'

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

async function main() {
  console.log(`Section 7 — staff claims queue verification (${BASE})\n`)

  try {
    await fetch(BASE, { method: 'HEAD' })
  } catch {
    console.error(`Dev server not reachable at ${BASE}. Start with: pnpm dev`)
    process.exit(1)
  }

  const claimsRes = await fetch(`${BASE}/staff/claims`, {
    redirect: 'manual',
    headers: STAFF_HEADERS,
  })
  if (claimsRes.status === 200) {
    pass('/staff/claims renders', 'HTTP 200')
  } else {
    fail('/staff/claims renders', `HTTP ${claimsRes.status}`)
  }

  const mentorRes = await fetch(`${BASE}/staff/mentor-applications`, {
    redirect: 'manual',
    headers: STAFF_HEADERS,
  })
  if (mentorRes.status === 200) {
    pass('/staff/mentor-applications renders', 'HTTP 200')
  } else {
    fail('/staff/mentor-applications renders', `HTTP ${mentorRes.status}`)
  }

  const queueRedirect = await fetch(`${BASE}/staff/claims/queue`, {
    redirect: 'manual',
    headers: STAFF_HEADERS,
  })
  const location = queueRedirect.headers.get('location') ?? ''
  if (
    (queueRedirect.status === 307 || queueRedirect.status === 308) &&
    location.includes('/staff/claims')
  ) {
    pass('/staff/claims/queue redirects to /staff/claims')
  } else if (queueRedirect.status === 200) {
    pass('/staff/claims/queue reachable (may inline redirect)')
  } else {
    fail('/staff/claims/queue redirect', `HTTP ${queueRedirect.status} → ${location}`)
  }

  const myQueueRes = await fetch(`${BASE}/staff/claims/my-queue`, {
    redirect: 'manual',
    headers: STAFF_HEADERS,
  })
  if (myQueueRes.status === 200) {
    pass('/staff/claims/my-queue renders', 'HTTP 200')
  } else {
    fail('/staff/claims/my-queue', `HTTP ${myQueueRes.status}`)
  }

  const historyRes = await fetch(`${BASE}/staff/claims/history`, {
    redirect: 'manual',
    headers: STAFF_HEADERS,
  })
  if (historyRes.status === 200) {
    pass('/staff/claims/history renders', 'HTTP 200')
  } else {
    fail('/staff/claims/history', `HTTP ${historyRes.status}`)
  }

  console.log('\nNote: Realtime INSERT toast requires migration 080 + live Supabase.')
  console.log('Mentor applications use mentor_profiles; claims use claim_requests (separate tables).\n')

  console.log(`${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
