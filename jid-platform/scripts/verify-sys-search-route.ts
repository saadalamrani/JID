/**
 * Section 9 / 12 — sys command palette search route verification.
 * Run with dev server: pnpm dev
 * Then: pnpm tsx scripts/verify-sys-search-route.ts
 */

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'
const TARGET = '/sys/search?q=test'

type Case = {
  label: string
  headers: Record<string, string>
  expectStatus: number
}

const cases: Case[] = [
  {
    label: 'individual → 404 (in-route role check)',
    headers: { 'x-jid-test-role': 'individual', 'x-jid-test-aal2': 'true' },
    expectStatus: 404,
  },
  {
    label: 'staff → 404 (in-route role check)',
    headers: { 'x-jid-test-role': 'staff', 'x-jid-test-aal2': 'true' },
    expectStatus: 404,
  },
  {
    label: 'super_admin + MFA → 200 JSON',
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
    headers: testCase.headers,
  })

  const ok = response.status === testCase.expectStatus

  if (ok && testCase.expectStatus === 200) {
    const body = (await response.json()) as { users?: unknown[]; entities?: unknown[] }
    if (!Array.isArray(body.users) || !Array.isArray(body.entities)) {
      failed += 1
      console.log(`  FAIL  ${testCase.label} → invalid JSON shape`)
      return
    }
  }

  if (ok) {
    passed += 1
    console.log(`  PASS  ${testCase.label} → HTTP ${response.status}`)
  } else {
    failed += 1
    console.log(`  FAIL  ${testCase.label} → expected ${testCase.expectStatus}, got ${response.status}`)
  }
}

async function main() {
  console.log(`\n/sys/search route checks (${BASE})\n`)

  for (const testCase of cases) {
    await runCase(testCase)
  }

  console.log(`\n${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
