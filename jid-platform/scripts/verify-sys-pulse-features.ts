/**
 * Section 12 Step 2 — Platform Pulse features panel verification.
 *
 * Run: pnpm tsx scripts/verify-sys-pulse-features.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { hasMinimalTraction } from '../src/lib/features/has-minimal-traction'
import { FEATURE_FLAG_KEYS } from '../src/lib/features/feature-flag-keys'

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'
const FLAG = FEATURE_FLAG_KEYS.PLATFORM_PULSE_ANNOUNCEMENTS

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

async function main() {
  console.log('Section 12 Step 2 — Platform Pulse features panel\n')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  // Route guard — super_admin only under /sys
  try {
    await fetch(BASE, { method: 'HEAD' })
    const individual = await fetch(`${BASE}/sys/features`, {
      redirect: 'manual',
      headers: { 'x-jid-test-role': 'individual', 'x-jid-test-aal2': 'true' },
    })
    if (individual.status === 404) pass('/sys/features blocked for individual → 404')
    else fail('/sys/features guard', `HTTP ${individual.status}`)

    const superAdmin = await fetch(`${BASE}/sys/features`, {
      redirect: 'manual',
      headers: { 'x-jid-test-role': 'super_admin', 'x-jid-test-aal2': 'true' },
    })
    if (superAdmin.status === 200) pass('/sys/features accessible for super_admin → 200')
    else fail('/sys/features super_admin', `HTTP ${superAdmin.status}`)
  } catch {
    fail('dev server', `not reachable at ${BASE}`)
  }

  const { data: before } = await admin
    .from('feature_flags')
    .select('is_enabled')
    .eq('key', FLAG)
    .maybeSingle()

  if (!before) {
    fail('seed', `${FLAG} missing`)
    process.exit(1)
  }

  const original = before.is_enabled

  await admin.from('feature_flags').update({ is_enabled: false }).eq('key', FLAG)
  const { data: off } = await admin.from('feature_flags').select('is_enabled').eq('key', FLAG).single()
  if (off?.is_enabled === false) pass('toggle OFF persists in feature_flags')
  else fail('toggle OFF', JSON.stringify(off))

  await admin.from('feature_flags').update({ is_enabled: true }).eq('key', FLAG)
  const { data: on } = await admin.from('feature_flags').select('is_enabled').eq('key', FLAG).single()
  if (on?.is_enabled === true) pass('toggle ON persists in feature_flags')
  else fail('toggle ON', JSON.stringify(on))

  await admin.from('feature_flags').update({ is_enabled: original }).eq('key', FLAG)

  const { data: thresholds } = await admin
    .from('metric_thresholds')
    .select('metric_key, min_value, current_value, is_met')
    .eq('metric_key', 'total_candidates')
    .single()

  if (!thresholds) {
    fail('thresholds', 'total_candidates row missing')
  } else {
    const originalMin = Number(thresholds.min_value)
    await admin
      .from('metric_thresholds')
      .update({ min_value: 0 })
      .eq('metric_key', 'total_candidates')

    const { data: lowered } = await admin
      .from('metric_thresholds')
      .select('is_met')
      .eq('metric_key', 'total_candidates')
      .single()

    if (lowered?.is_met === true) pass('is_met recalculates when min_value lowered (is_displayed=true)')
    else fail('is_met recalc', `is_met=${String(lowered?.is_met)}`)

    await admin
      .from('metric_thresholds')
      .update({ min_value: originalMin })
      .eq('metric_key', 'total_candidates')
  }

  const { data: allThresholds } = await admin
    .from('metric_thresholds')
    .select('metric_key, is_met')

  if (allThresholds && !hasMinimalTraction(allThresholds)) {
    pass('hasMinimalTraction() returns false on seed data (expected)')
  } else {
    fail('hasMinimalTraction seed', 'expected false on empty current values')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
