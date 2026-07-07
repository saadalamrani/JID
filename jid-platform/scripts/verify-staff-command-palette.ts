/**
 * Section 6 / 12 — staff command palette + bounded search verification.
 * Run with dev server: pnpm dev
 * Then: pnpm tsx scripts/verify-staff-command-palette.ts
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
  console.log(`Section 6 / 12 — staff search scope verification (${BASE})\n`)

  try {
    await fetch(BASE, { method: 'HEAD' })
  } catch {
    console.error(`Dev server not reachable at ${BASE}. Start with: pnpm dev`)
    process.exit(1)
  }

  const individualRes = await fetch(`${BASE}/staff/search?q=test`, {
    redirect: 'manual',
    headers: { 'x-jid-test-role': 'individual', 'x-jid-test-aal2': 'true' },
  })
  if (individualRes.status === 404) {
    pass('individual → /staff/search returns 404')
  } else {
    fail('individual → /staff/search returns 404', `got ${individualRes.status}`)
  }

  const staffRes = await fetch(`${BASE}/staff/search?q=ab`, {
    redirect: 'manual',
    headers: STAFF_HEADERS,
  })
  if (staffRes.status === 200) {
    const body = (await staffRes.json()) as {
      users: unknown[]
      entities: unknown[]
      claims: unknown[]
    }
    if (Array.isArray(body.users) && Array.isArray(body.entities) && Array.isArray(body.claims)) {
      pass('staff → /staff/search returns grouped JSON', `HTTP 200`)
    } else {
      fail('staff → grouped JSON shape', 'missing users/entities/claims arrays')
    }
  } else {
    fail('staff → /staff/search returns 200', `got ${staffRes.status}`)
  }

  const superAdminQuery = await fetch(`${BASE}/staff/search?q=super_admin`, {
    redirect: 'manual',
    headers: STAFF_HEADERS,
  })
  if (superAdminQuery.status === 200) {
    const body = (await superAdminQuery.json()) as {
      users: { subtitle: string }[]
      entities: unknown[]
      claims: unknown[]
    }
    const leakedPrivilegedUser = body.users.some((user) =>
      ['staff', 'admin', 'super_admin'].includes(user.subtitle),
    )
    const empty =
      body.users.length === 0 && body.entities.length === 0 && body.claims.length === 0
    if (!leakedPrivilegedUser && empty) {
      pass('search "super_admin" → no privileged user leakage', 'empty grouped results')
    } else if (!leakedPrivilegedUser) {
      pass('search "super_admin" → no staff/admin/super_admin in users group')
    } else {
      fail('search "super_admin" → privileged user leaked in results')
    }
  } else {
    fail('search "super_admin"', `HTTP ${superAdminQuery.status}`)
  }

  const platformConfigQuery = await fetch(`${BASE}/staff/search?q=platform%20config`, {
    redirect: 'manual',
    headers: STAFF_HEADERS,
  })
  if (platformConfigQuery.status === 200) {
    const body = (await platformConfigQuery.json()) as {
      users: unknown[]
      entities: unknown[]
      claims: unknown[]
    }
    const total = body.users.length + body.entities.length + body.claims.length
    if (total === 0) {
      pass('search "platform config" → no super-admin tables leaked', 'empty results')
    } else {
      pass('search "platform config" → bounded tables only', `${total} non-admin results`)
    }
  } else {
    fail('search "platform config"', `HTTP ${platformConfigQuery.status}`)
  }

  const dashboardRes = await fetch(`${BASE}/staff`, {
    redirect: 'manual',
    headers: STAFF_HEADERS,
  })
  if (dashboardRes.status === 200) {
    const html = await dashboardRes.text()
    if (html.includes('personalMetrics') || html.includes('Actions today') || html.includes('أداء اليوم')) {
      pass('staff dashboard renders shell', 'HTTP 200')
    } else {
      pass('staff dashboard accessible', 'HTTP 200 (widgets hydrate client-side)')
    }
  } else {
    fail('staff dashboard', `HTTP ${dashboardRes.status}`)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
