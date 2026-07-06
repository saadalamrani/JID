/**
 * Section 5.1 — /sys layout guard verification.
 * Run with dev server: pnpm dev
 * Then: pnpm tsx scripts/verify-sys-layout-guards.ts
 */

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'
const TARGET = '/sys/dashboard'

type Case = {
  label: string
  headers: Record<string, string>
  expectStatus: number
  expectLocationIncludes?: string
}

const cases: Case[] = [
  {
    label: 'individual → 404 (hide route existence)',
    headers: { 'x-jid-test-role': 'individual', 'x-jid-test-aal2': 'true' },
    expectStatus: 404,
  },
  {
    label: 'staff → 404 (hide route existence)',
    headers: { 'x-jid-test-role': 'staff', 'x-jid-test-aal2': 'true' },
    expectStatus: 404,
  },
  {
    label: 'super_admin without MFA → redirect /sys/mfa',
    headers: { 'x-jid-test-role': 'super_admin' },
    expectStatus: 307,
    expectLocationIncludes: '/sys/mfa',
  },
  {
    label: 'super_admin expired session → redirect /sys/login?reason=expired',
    headers: {
      'x-jid-test-role': 'super_admin',
      'x-jid-test-aal2': 'true',
      'x-jid-test-session-issued-at': String(Math.floor(Date.now() / 1000) - 7201),
    },
    expectStatus: 307,
    expectLocationIncludes: '/sys/login',
  },
  {
    label: 'super_admin fresh session + MFA → 200 shell',
    headers: {
      'x-jid-test-role': 'super_admin',
      'x-jid-test-aal2': 'true',
    },
    expectStatus: 200,
  },
]

let passed = 0
let failed = 0

async function runCase(testCase: Case) {
  const response = await fetch(`${BASE}${TARGET}`, {
    redirect: 'manual',
    headers: testCase.headers,
  })

  const location = response.headers.get('location') ?? ''
  let ok = response.status === testCase.expectStatus

  if (testCase.expectLocationIncludes && !location.includes(testCase.expectLocationIncludes)) {
    ok = false
  }

  if (testCase.label.includes('expired') && !location.includes('reason=expired')) {
    ok = false
  }

  if (ok) {
    passed += 1
    console.log(`  PASS  ${testCase.label} → HTTP ${response.status}${location ? ` → ${location}` : ''}`)
  } else {
    failed += 1
    console.log(
      `  FAIL  ${testCase.label} → expected ${testCase.expectStatus}${
        testCase.expectLocationIncludes ? ` location *${testCase.expectLocationIncludes}*` : ''
      }, got ${response.status}${location ? ` location=${location}` : ''}`,
    )
  }
}

async function main() {
  console.log(`Section 5.1 — /sys guard verification (${BASE}${TARGET})\n`)

  try {
    await fetch(BASE, { method: 'HEAD' })
  } catch {
    console.error(`Dev server not reachable at ${BASE}. Start with: pnpm dev`)
    process.exit(1)
  }

  for (const testCase of cases) {
    await runCase(testCase)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
