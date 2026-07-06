/**
 * Section 6 — dashboard load + metrics verification.
 * Run with dev server: pnpm dev
 * Then: pnpm tsx scripts/verify-sys-dashboard.ts
 */

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'
const TARGET = '/sys/dashboard'
const MAX_LOAD_MS = 1000

const HEADERS = {
  'x-jid-test-role': 'super_admin',
  'x-jid-test-aal2': 'true',
}

let passed = 0
let failed = 0

function pass(label: string) {
  passed += 1
  console.log(`  PASS  ${label}`)
}

function fail(label: string, detail: string) {
  failed += 1
  console.log(`  FAIL  ${label} → ${detail}`)
}

async function main() {
  console.log(`\n/sys dashboard checks (${BASE}${TARGET})\n`)

  // Warm compile/cache so load-time check reflects steady-state navigation.
  await fetch(`${BASE}${TARGET}`, { headers: HEADERS, redirect: 'manual' })

  const started = Date.now()
  const response = await fetch(`${BASE}${TARGET}`, {
    headers: HEADERS,
    redirect: 'manual',
  })
  const elapsed = Date.now() - started

  if (response.status === 200) {
    pass(`HTTP 200 (${elapsed}ms)`)
  } else {
    fail('HTTP status', `expected 200, got ${response.status}`)
  }

  if (elapsed < MAX_LOAD_MS) {
    pass(`load time < ${MAX_LOAD_MS}ms`)
  } else {
    fail('load time', `${elapsed}ms exceeds ${MAX_LOAD_MS}ms budget`)
  }

  const html = await response.text()

  const metricHints = [
    ['Total users', 'إجمالي المستخدمين'],
    ['Active sessions', 'الجلسات النشطة'],
    ['Pending claims', 'مطالبات معلقة'],
    ['Overdue claims', 'مطالبات متأخرة'],
    ['Audit events', 'أحداث التدقيق'],
    ['Mentor applications', 'طلبات المرشدين'],
  ] as const

  for (const variants of metricHints) {
    if (variants.some((hint) => html.includes(hint))) {
      pass(`metric card present: ${variants[0]}`)
    } else {
      fail(`metric card: ${variants[0]}`, 'not found in HTML')
    }
  }

  if (html.includes('Last refreshed') || html.includes('آخر تحديث')) {
    pass('last refreshed timestamp visible')
  } else {
    fail('last refreshed', 'timestamp label not found')
  }

  if (
    (html.includes('Claims queue') || html.includes('طابور المطالبات')) &&
    (html.includes('Recent activity') || html.includes('النشاط الأخير'))
  ) {
    pass('widgets rendered')
  } else {
    fail('widgets', 'claims queue or recent activity missing')
  }

  if (html.includes('System health') || html.includes('صحة النظام')) {
    pass('system health panel rendered')
  } else {
    fail('system health', 'panel missing')
  }

  console.log(`\n${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
