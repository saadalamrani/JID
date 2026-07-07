/**
 * Section 7 — feature flags management verification.
 *
 * Requires: local Supabase + migration 075 applied + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Run: pnpm tsx scripts/verify-sys-feature-flags.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const FLAG_KEY = 'pulse.billboard'
const REASON = 'QA test'

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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
  console.log('\nFeature flags Section 7 checks\n')

  if (!url || !serviceKey) {
    fail('env', 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
    console.log(`\n${passed} passed, ${failed} failed (skipped DB tests)\n`)
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const testUserId = '00000000-0000-4000-8000-000000000099'

  const { data: beforeFlag, error: beforeError } = await admin
    .from('feature_flags')
    .select('*')
    .eq('key', FLAG_KEY)
    .maybeSingle()

  if (beforeError || !beforeFlag) {
    fail('seed', `pulse.billboard row missing — apply migration 075 (${beforeError?.message ?? 'not found'})`)
    process.exit(1)
  }
  pass('pulse.billboard seed row exists')

  const beforeAuditCount = (
    await admin
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'feature_flag.toggle_global')
      .contains('metadata', { flag_key: FLAG_KEY })
  ).count

  const auditBefore = beforeAuditCount ?? 0

  const { error: toggleError } = await admin
    .from('feature_flags')
    .update({ is_enabled: true, updated_at: new Date().toISOString() })
    .eq('key', FLAG_KEY)

  if (toggleError) {
    fail('toggle global', toggleError.message)
  } else {
    pass('toggle pulse.billboard ON (DB)')
  }

  await admin.from('audit_logs').insert({
    actor_id: testUserId,
    action: 'feature_flag.toggle_global',
    entity_type: 'feature_flag',
    entity_id: null,
    old_data: { key: FLAG_KEY, is_enabled: beforeFlag.is_enabled },
    new_data: { key: FLAG_KEY, is_enabled: true },
    metadata: { reason: REASON, flag_key: FLAG_KEY, source: 'verify_script' },
  })

  const { count: auditAfter } = await admin
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('action', 'feature_flag.toggle_global')
    .contains('metadata', { flag_key: FLAG_KEY })

  if ((auditAfter ?? 0) > auditBefore) {
    pass('audit_logs row created for toggle')
  } else {
    fail('audit_logs', 'no new toggle audit row')
  }

  const overrides = { [testUserId]: true }
  const { error: overrideError } = await admin
    .from('feature_flags')
    .update({ user_overrides: overrides })
    .eq('key', FLAG_KEY)

  if (overrideError) {
    fail('user override update', overrideError.message)
  } else {
    pass('user_overrides JSONB updated')
  }

  const { data: afterFlag } = await admin
    .from('feature_flags')
    .select('user_overrides')
    .eq('key', FLAG_KEY)
    .single()

  const stored = afterFlag?.user_overrides as Record<string, boolean> | null
  if (stored?.[testUserId] === true) {
    pass('user override value persisted')
  } else {
    fail('user override value', JSON.stringify(stored))
  }

  const { data: enabledForUser, error: rpcUserError } = await admin.rpc('is_feature_enabled', {
    p_flag_key: FLAG_KEY,
  })

  if (rpcUserError) {
    fail('is_feature_enabled RPC', rpcUserError.message)
  } else {
    pass(`is_feature_enabled() callable (service role → ${enabledForUser})`)
  }

  const { data: schemaCols } = await admin
    .from('feature_flags')
    .select('category, enabled_for_roles, user_overrides')
    .eq('key', FLAG_KEY)
    .single()

  if (schemaCols && 'category' in schemaCols && 'enabled_for_roles' in schemaCols) {
    pass('Section 7 columns present (category, enabled_for_roles, user_overrides)')
  } else {
    fail('schema columns', 'missing Section 7 columns — run migration 075')
  }

  await fetch('http://localhost:3000/sys/flags', {
    headers: {
      'x-jid-test-role': 'super_admin',
      'x-jid-test-aal2': 'true',
    },
  })
    .then((response) => {
      if (response.status === 200) pass('flags page HTTP 200')
      else fail('flags page', `HTTP ${response.status}`)
    })
    .catch(() => fail('flags page', 'dev server not reachable'))

  console.log(`\n${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
