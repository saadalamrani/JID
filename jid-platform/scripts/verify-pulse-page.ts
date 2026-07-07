/**
 * Section 12 Steps 6 + 11 — Pulse page flag gates and disabled placeholder verification.
 *
 * Run: pnpm tsx scripts/verify-pulse-page.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FEATURE_FLAG_KEYS } from '../src/lib/features/feature-flag-keys'
import { invalidateMiddlewarePulsePublicCache } from '../src/lib/features/middleware-pulse-flag'

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'
const MASTER_FLAG = FEATURE_FLAG_KEYS.PLATFORM_PULSE_PUBLIC

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

async function fetchPulse(options: RequestInit = {}, pulsePublic?: boolean) {
  const headers = new Headers(options.headers)
  if (pulsePublic !== undefined) {
    headers.set('x-jid-test-pulse-public', pulsePublic ? 'true' : 'false')
  }
  return fetch(`${BASE}/pulse`, { redirect: 'manual', ...options, headers })
}

async function main() {
  console.log('Section 12 Steps 6 + 11 — Pulse page\n')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  try {
    await fetch(BASE, { method: 'HEAD' })
  } catch {
    fail('dev server', `not reachable at ${BASE}`)
    console.log(`\n${passed} passed, ${failed} failed`)
    process.exit(1)
  }

  const { data: before } = await admin
    .from('feature_flags')
    .select('is_enabled')
    .eq('key', MASTER_FLAG)
    .maybeSingle()

  const originalEnabled = before?.is_enabled ?? false
  invalidateMiddlewarePulsePublicCache()
  await admin.from('feature_flags').update({ is_enabled: false }).eq('key', MASTER_FLAG)
  invalidateMiddlewarePulsePublicCache()

  const anonOff = await fetchPulse({}, false)
  if (anonOff.status === 404) pass('anonymous /pulse with master flag off → HTTP 404')
  else fail('anonymous 404 when disabled', `HTTP ${anonOff.status}`)

  const individualOff = await fetchPulse(
    {
      headers: { 'x-jid-test-role': 'individual', 'x-jid-test-aal2': 'true' },
    },
    false,
  )
  if (individualOff.status === 404) pass('individual /pulse with master flag off → HTTP 404')
  else fail('individual 404 when disabled', `HTTP ${individualOff.status}`)

  const superOff = await fetchPulse(
    {
      headers: { 'x-jid-test-role': 'super_admin', 'x-jid-test-aal2': 'true' },
    },
    false,
  )
  const superOffBody = superOff.ok ? await superOff.text() : ''
  const showsDisabledPlaceholder =
    superOff.status === 200 &&
    (superOffBody.includes('Platform Pulse is disabled') ||
      superOffBody.includes('نبض المنصة معطّل'))
  if (showsDisabledPlaceholder) {
    pass('super_admin sees disabled placeholder when master flag off → HTTP 200')
  } else {
    fail('super_admin disabled placeholder', `HTTP ${superOff.status}`)
  }

  if (superOffBody.includes('/sys/features')) {
    pass('disabled placeholder links to /sys/features')
  } else {
    fail('features panel link', 'href to /sys/features not found in HTML')
  }

  await admin.from('feature_flags').update({ is_enabled: true }).eq('key', MASTER_FLAG)
  invalidateMiddlewarePulsePublicCache()

  const anonOn = await fetchPulse({}, true)
  const anonOnBody = anonOn.ok ? await anonOn.text() : ''
  if (
    anonOn.status === 200 &&
    (anonOnBody.includes('Platform Pulse') || anonOnBody.includes('نبض المنصة'))
  ) {
    pass('anonymous /pulse with master flag on → HTTP 200 shell')
  } else {
    fail('anonymous shell when enabled', `HTTP ${anonOn.status}`)
  }

  if (
    anonOnBody.includes('Announcements billboard') ||
    anonOnBody.includes('لوحة الإعلانات') ||
    anonOnBody.includes('announcements')
  ) {
    pass('enabled shell includes announcements placeholder')
  } else {
    fail('announcements placeholder', 'not found in HTML')
  }

  await admin.from('feature_flags').update({ is_enabled: originalEnabled }).eq('key', MASTER_FLAG)
  invalidateMiddlewarePulsePublicCache()
  pass('restored platform_pulse_public flag')

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
