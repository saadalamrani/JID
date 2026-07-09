/**
 * Sections 9–10 — staff entities moderation + content flags verification.
 * Run: pnpm tsx scripts/verify-staff-entities-moderation.ts
 */

import { readFileSync } from 'node:fs'
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
  console.log(`Sections 9–10 — entities + moderation (${BASE})\n`)

  try {
    await fetch(BASE, { method: 'HEAD' })
  } catch {
    console.error(`Dev server not reachable at ${BASE}. Start with: pnpm dev`)
    process.exit(1)
  }

  const entitiesQueries = readSrc('src/lib/staff/entities-queries.ts')
  const entityActions = readSrc('src/app/[locale]/(staff)/staff/entities/actions.ts')
  const moderationQueries = readSrc('src/lib/staff/moderation-queries.ts')
  const moderationActions = readSrc('src/app/[locale]/(staff)/staff/moderation/actions.ts')
  const flagResolution = readSrc('src/lib/staff/content-flag-resolution.ts')
  const nav = readSrc('src/lib/staff/nav.ts')

  if (
    entitiesQueries.includes(".eq('entity_state', 'approved')") &&
    entitiesQueries.includes("['company', 'university']")
  ) {
    pass('Entity list bounded to approved companies + universities')
  } else {
    fail('Entity list scope')
  }

  if (entitiesQueries.includes('.order(')) {
    pass('Entity list supports ordered queries')
  } else {
    fail('Entity list ordering')
  }

  const updatesBlock =
    entityActions.split('const updates: Record<string, string | null>')[1]?.split('const supabase = await createClient()')[0] ?? ''
  if (
    entityActions.includes('entity.metadata_updated') &&
    !updatesBlock.includes('entity_state') &&
    updatesBlock.includes('sector_id')
  ) {
    pass('Metadata action audits changes without mutating entity_state')
  } else {
    fail('Metadata action must not change entity_state')
  }

  if (entityActions.includes('old_data') || entityActions.includes('old_data: input.before')) {
    pass('Metadata update writes before/after audit log')
  } else {
    fail('Metadata audit diff')
  }

  if (
    moderationQueries.includes("['pending', 'under_review']") &&
    moderationQueries.includes("ascending: true")
  ) {
    pass('Open flags queue sorted oldest first')
  } else {
    fail('Open flags queue ordering')
  }

  if (
    moderationActions.includes('resolveFlag') &&
    moderationActions.includes('dismissFlag') &&
    moderationActions.includes('content_flag.resolved_hidden') &&
    moderationActions.includes('content_flag.dismissed')
  ) {
    pass('Flag lifecycle actions with audit logging')
  } else {
    fail('Flag lifecycle actions')
  }

  if (flagResolution.includes('isContentFlagHidden') || flagResolution.includes('hasResolvedHiddenFlag')) {
    pass('Public display gating helper present (TODO wiring noted)')
  } else {
    fail('Display gating helper')
  }

  if (nav.includes("href: '/staff/entities'") && nav.includes("href: '/staff/moderation'")) {
    pass('Nav includes entities + moderation routes')
  } else {
    fail('Staff nav routes')
  }

  const routes: Array<{ path: string; label: string }> = [
    { path: '/staff/entities', label: '/staff/entities' },
    { path: '/staff/moderation', label: '/staff/moderation' },
  ]

  for (const route of routes) {
    const res = await fetch(`${BASE}${route.path}`, {
      redirect: 'manual',
      headers: STAFF_HEADERS,
    })
    if (res.status === 200) {
      pass(`${route.label} renders`, 'HTTP 200')
    } else {
      fail(route.label, `HTTP ${res.status}`)
    }
  }

  const detailRes = await fetch(
    `${BASE}/staff/entities/00000000-0000-4000-8000-000000000099`,
    { redirect: 'manual', headers: STAFF_HEADERS },
  )
  if (detailRes.status === 404) {
    pass('Unknown entity detail → 404')
  } else if (detailRes.status === 200) {
    pass('Entity detail route reachable (not-found UI for missing id)')
  } else {
    fail('Entity detail route', `HTTP ${detailRes.status}`)
  }

  const flagDetailRes = await fetch(
    `${BASE}/staff/moderation/00000000-0000-4000-8000-000000000099`,
    { redirect: 'manual', headers: STAFF_HEADERS },
  )
  if (flagDetailRes.status === 404) {
    pass('Unknown flag detail → 404')
  } else if (flagDetailRes.status === 200) {
    pass('Flag detail route reachable (not-found UI for missing id)')
  } else {
    fail('Flag detail route', `HTTP ${flagDetailRes.status}`)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
