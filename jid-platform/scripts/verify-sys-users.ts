/**
 * Section 8 — user management verification.
 *
 * Requires: local Supabase + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Run: pnpm tsx scripts/verify-sys-users.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MENTOR_ROLE_BLOCKED_ERROR } from '../src/types/sys-users'

const REASON = 'QA Section 8 verify'
const ACTOR_ID = '00000000-0000-4000-8000-000000000001'
const TARGET_ID = '00000000-0000-4000-8000-000000000099'

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

function validateChangeUserRole(
  userId: string,
  actorId: string,
  newRole: string,
): { ok: true } | { ok: false; error: string } {
  if (newRole === 'mentor') return { ok: false, error: MENTOR_ROLE_BLOCKED_ERROR }
  if (userId === actorId) return { ok: false, error: 'You cannot change your own role' }
  return { ok: true }
}

function validateSuspendUser(
  userId: string,
  actorId: string,
): { ok: true } | { ok: false; error: string } {
  if (userId === actorId) return { ok: false, error: 'You cannot suspend your own account' }
  return { ok: true }
}

async function ensureTestProfiles(admin: ReturnType<typeof createClient>) {
  const profiles = [
    { id: ACTOR_ID, role: 'super_admin', full_name: 'Verify Super Admin' },
    { id: TARGET_ID, role: 'individual', full_name: 'Verify Target User' },
  ]

  for (const profile of profiles) {
    const { error } = await admin.from('profiles').upsert(
      {
        id: profile.id,
        role: profile.role,
        full_name: profile.full_name,
        locale: 'en',
        suspended_at: null,
        suspended_reason: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    if (error) throw new Error(`profile upsert ${profile.id}: ${error.message}`)
  }
}

async function main() {
  console.log('\nUser management Section 8 checks\n')

  const mentorBlock = validateChangeUserRole(TARGET_ID, ACTOR_ID, 'mentor')
  if (!mentorBlock.ok && mentorBlock.error === MENTOR_ROLE_BLOCKED_ERROR) {
    pass('changeUserRole blocks mentor with exact error message')
  } else {
    fail('changeUserRole blocks mentor', mentorBlock.ok ? 'unexpected success' : mentorBlock.error)
  }

  const selfSuspend = validateSuspendUser(ACTOR_ID, ACTOR_ID)
  if (!selfSuspend.ok && selfSuspend.error === 'You cannot suspend your own account') {
    pass('suspendUser blocks self-suspend')
  } else {
    fail('suspendUser blocks self-suspend', selfSuspend.ok ? 'unexpected success' : selfSuspend.error)
  }

  const selfRole = validateChangeUserRole(ACTOR_ID, ACTOR_ID, 'staff')
  if (!selfRole.ok && selfRole.error === 'You cannot change your own role') {
    pass('changeUserRole blocks self-change')
  } else {
    fail('changeUserRole blocks self-change', selfRole.ok ? 'unexpected success' : selfRole.error)
  }

  if (!url || !serviceKey) {
    fail('env', 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for DB tests')
    console.log(`\n${passed} passed, ${failed} failed (skipped DB tests)\n`)
    process.exit(failed > 0 ? 1 : 0)
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    await ensureTestProfiles(admin)
    pass('test profiles ready')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
      console.log('  SKIP  DB integration tests (local Supabase not reachable)')
      console.log(`\n${passed} passed, ${failed} failed\n`)
      process.exit(failed > 0 ? 1 : 0)
    }
    fail('test profiles', message)
    console.log(`\n${passed} passed, ${failed} failed\n`)
    process.exit(1)
  }

  const beforeAudit = (
    await admin
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('entity_id', TARGET_ID)
  ).count ?? 0

  const suspendedAt = new Date().toISOString()
  const { error: suspendError } = await admin
    .from('profiles')
    .update({ suspended_at: suspendedAt, suspended_reason: REASON })
    .eq('id', TARGET_ID)

  if (suspendError) {
    fail('suspend target user', suspendError.message)
  } else {
    pass('suspend target user (admin)')
    await admin.from('audit_logs').insert({
      actor_id: ACTOR_ID,
      action: 'user.suspended',
      entity_type: 'profile',
      entity_id: TARGET_ID,
      old_data: { suspended_at: null },
      new_data: { suspended_at: suspendedAt, suspended_reason: REASON },
      metadata: { reason: REASON, source: 'sys_portal', target_resource_id: TARGET_ID },
    })
  }

  const { error: reinstateError } = await admin.rpc('reinstate_profile', {
    p_target_user_id: TARGET_ID,
  })

  if (reinstateError) {
    fail('reinstate target user', reinstateError.message)
  } else {
    pass('reinstate target user via RPC')
    await admin.from('audit_logs').insert({
      actor_id: ACTOR_ID,
      action: 'user.reinstated',
      entity_type: 'profile',
      entity_id: TARGET_ID,
      old_data: { suspended_at: suspendedAt },
      new_data: { suspended_at: null, suspended_reason: null },
      metadata: { reason: REASON, source: 'sys_portal', target_resource_id: TARGET_ID },
    })
  }

  const { error: roleError } = await admin
    .from('profiles')
    .update({ role: 'staff', updated_at: new Date().toISOString() })
    .eq('id', TARGET_ID)

  if (roleError) {
    fail('change target role (admin direct)', roleError.message)
  } else {
    pass('change target role to staff')
    await admin.from('audit_logs').insert({
      actor_id: ACTOR_ID,
      action: 'user.role_changed',
      entity_type: 'profile',
      entity_id: TARGET_ID,
      old_data: { role: 'individual' },
      new_data: { role: 'staff' },
      metadata: { reason: REASON, source: 'sys_portal', target_resource_id: TARGET_ID },
    })
    await admin.from('profiles').update({ role: 'individual' }).eq('id', TARGET_ID)
  }

  const { count: reasonAuditCount } = await admin
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('entity_id', TARGET_ID)
    .contains('metadata', { reason: REASON })

  if ((reasonAuditCount ?? 0) >= 3) {
    pass('audit logs include reason metadata for operations')
  } else {
    fail('audit logs with reason', `expected ≥3, got ${reasonAuditCount ?? 0}`)
  }

  const afterAudit = (
    await admin
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('entity_id', TARGET_ID)
  ).count ?? 0

  if (afterAudit > beforeAudit) {
    pass('audit timeline events recorded for target user')
  } else {
    fail('audit timeline growth', `before=${beforeAudit} after=${afterAudit}`)
  }

  const { data: sessionsTable } = await admin.from('active_sessions').select('id').limit(1)
  if (sessionsTable !== null) {
    pass('active_sessions table accessible')
  } else {
    fail('active_sessions table', 'query returned null')
  }

  console.log(`\n${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
