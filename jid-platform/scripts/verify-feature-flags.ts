/**
 * Section 12 Step 1 — Platform Pulse feature flag foundation verification.
 *
 * Requires: .env.local with Supabase credentials; migrations 013 + 014 applied.
 *
 * Run: pnpm tsx scripts/verify-feature-flags.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FEATURE_FLAG_KEYS } from '../src/lib/features/feature-flag-keys'

const FLAG = FEATURE_FLAG_KEYS.PLATFORM_PULSE_PUBLIC

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

let passed = 0
let failed = 0

function pass(label: string, detail?: string) {
  passed += 1
  console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`)
}

function fail(label: string, detail: string) {
  failed += 1
  console.log(`  FAIL  ${label} — ${detail}`)
}

/** Mirrors getFeatureFlag() — must fail closed. */
async function readFlag(
  client: ReturnType<typeof createClient>,
  key: string,
): Promise<boolean> {
  try {
    const { data, error } = await client
      .from('feature_flags')
      .select('is_enabled')
      .eq('key', key)
      .maybeSingle()
    if (error || !data) return false
    return data.is_enabled === true
  } catch {
    return false
  }
}

async function main() {
  console.log('Section 12 Step 1 — Feature flag foundation\n')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !serviceKey || !anonKey) {
    console.error('Missing Supabase env vars in .env.local')
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  const anon = createClient(url, anonKey, { auth: { persistSession: false } })

  const { data: row, error: rowError } = await admin
    .from('feature_flags')
    .select('is_enabled')
    .eq('key', FLAG)
    .maybeSingle()

  if (rowError || !row) {
    fail('seed row', `${FLAG} missing — apply migration 013_feature_flags.sql`)
    process.exit(1)
  }

  pass(`seed row exists`, FLAG)

  const missing = await readFlag(anon, 'definitely_not_a_real_flag_key_xyz')
  if (missing === false) pass('missing key fails closed → false')
  else fail('missing key', `expected false, got ${String(missing)}`)

  const original = row.is_enabled

  await admin.from('feature_flags').update({ is_enabled: true }).eq('key', FLAG)
  const onAnon = await readFlag(anon, FLAG)
  const onAdmin = await readFlag(admin, FLAG)
  if (onAnon && onAdmin) pass('DB flip ON reflected by anon + service readers')
  else fail('flip ON', `anon=${onAnon} admin=${onAdmin}`)

  await admin.from('feature_flags').update({ is_enabled: false }).eq('key', FLAG)
  const offAnon = await readFlag(anon, FLAG)
  if (!offAnon) pass('DB flip OFF reflected (fail closed)')
  else fail('flip OFF', `expected false, got ${String(offAnon)}`)

  await admin.from('feature_flags').update({ is_enabled: original }).eq('key', FLAG)

  const { data: thresholds, error: thresholdError } = await anon
    .from('metric_thresholds')
    .select('metric_key, min_value, is_met')
    .order('metric_key')

  if (thresholdError) {
    fail('metric_thresholds', thresholdError.message)
  } else if ((thresholds?.length ?? 0) < 6) {
    fail('metric_thresholds seeds', `expected 6 rows, got ${thresholds?.length ?? 0}`)
  } else {
    pass('metric_thresholds', `${thresholds!.length} seeded rows with generated is_met`)
    const candidates = thresholds!.find((t) => t.metric_key === 'total_candidates')
    if (candidates && candidates.min_value === 500 && candidates.is_met === false) {
      pass('total_candidates threshold', 'min=500, is_met=false at current_value=0')
    } else {
      fail('total_candidates', JSON.stringify(candidates))
    }
  }

  const guardSource = readFileSync(
    join(process.cwd(), 'src/lib/features/use-feature-flag.ts'),
    'utf8',
  )
  if (guardSource.includes('return enabled ? children : fallback')) {
    pass('PlatformPulseGuard hides children when flag is false')
  } else {
    fail('PlatformPulseGuard', 'expected conditional children render')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
