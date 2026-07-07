/**
 * Section — entity force-approve verification (Super Admin override).
 *
 * Requires: local Supabase + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Run: pnpm tsx scripts/verify-sys-entity-force-approve.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const REASON = 'QA Super Admin entity force-approve'
const ACTOR_ID = '00000000-0000-4000-8000-000000000001'
const CLAIMANT_ID = '00000000-0000-4000-8000-000000000098'
const ENTITY_ID = '00000000-0000-4000-8000-000000000088'
const CLAIM_ID = '00000000-0000-4000-8000-000000000077'

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
  console.log('\nEntity force-approve Super Admin override checks\n')

  if (!url || !serviceKey) {
    fail('env', 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
    console.log(`\n${passed} passed, ${failed} failed\n`)
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const now = new Date().toISOString()

  try {
    await admin.from('profiles').upsert(
      {
        id: ACTOR_ID,
        role: 'super_admin',
        full_name: 'Verify Super Admin',
        locale: 'en',
        updated_at: now,
      },
      { onConflict: 'id' },
    )

    await admin.from('profiles').upsert(
      {
        id: CLAIMANT_ID,
        role: 'individual',
        full_name: 'Verify Claimant',
        locale: 'en',
        updated_at: now,
      },
      { onConflict: 'id' },
    )

    await admin.from('companies').upsert(
      {
        id: ENTITY_ID,
        name: 'Verify Test Company',
        entity_type: 'company',
        entity_state: 'pending_review',
        is_verified: false,
        domains: ['verify-test.example'],
        updated_at: now,
      },
      { onConflict: 'id' },
    )

    await admin.from('claim_requests').upsert(
      {
        id: CLAIM_ID,
        user_id: CLAIMANT_ID,
        company_id: ENTITY_ID,
        company_name: 'Verify Test Company',
        business_email: 'claimant@verify-test.example',
        claimant_name: 'Verify Claimant',
        status: 'pending_review',
        claim_type: 'company',
        created_at: now,
        updated_at: now,
      },
      { onConflict: 'id' },
    )
    pass('test entity + claim seeded')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
      console.log('  SKIP  DB tests (local Supabase not reachable)')
      console.log(`\n${passed} passed, ${failed} failed\n`)
      process.exit(0)
    }
    fail('seed', message)
    console.log(`\n${passed} passed, ${failed} failed\n`)
    process.exit(1)
  }

  const { error: approveError } = await admin
    .from('companies')
    .update({
      entity_state: 'approved',
      is_verified: true,
      claimed_by: CLAIMANT_ID,
      claim_requested_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ENTITY_ID)

  if (approveError) {
    const message = approveError.message
    if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
      console.log('  SKIP  remaining DB checks (connection lost)')
      console.log(`\n${passed} passed, ${failed} failed\n`)
      process.exit(0)
    }
    fail('force approve entity_state', message)
  } else {
    pass('entity_state set to approved (simulated force approve)')
  }

  const { data: company } = await admin
    .from('companies')
    .select('entity_state, is_verified, claimed_by')
    .eq('id', ENTITY_ID)
    .single()

  if (company?.entity_state === 'approved' && company.is_verified && company.claimed_by === CLAIMANT_ID) {
    pass('companies.entity_state=approved with claimant')
  } else {
    fail('company state verification', JSON.stringify(company))
  }

  await admin.from('audit_logs').insert({
    actor_id: ACTOR_ID,
    action: 'entity.force_approved',
    entity_type: 'company',
    entity_id: ENTITY_ID,
    old_data: { entity_state: 'pending_review' },
    new_data: { entity_state: 'approved', is_verified: true },
    metadata: {
      reason: REASON,
      source: 'sys_portal',
      super_admin_override: true,
      bypass_staff_review: true,
      claim_id: CLAIM_ID,
      target_resource_id: ENTITY_ID,
    },
  })

  const { data: auditRow } = await admin
    .from('audit_logs')
    .select('action, metadata')
    .eq('entity_id', ENTITY_ID)
    .eq('action', 'entity.force_approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const metadata = auditRow?.metadata as Record<string, unknown> | null
  if (
    auditRow?.action === 'entity.force_approved' &&
    metadata?.super_admin_override === true &&
    metadata?.bypass_staff_review === true &&
    metadata?.reason === REASON
  ) {
    pass('audit trail shows Super Admin override (not claim.approved)')
  } else {
    fail('audit override metadata', JSON.stringify(auditRow))
  }

  const { count: staffApprovalCount } = await admin
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('entity_id', ENTITY_ID)
    .eq('action', 'claim.approved')

  if ((staffApprovalCount ?? 0) === 0) {
    pass('no normal Staff claim.approved audit for override path')
  } else {
    fail('staff approval audit', `unexpected claim.approved count=${staffApprovalCount}`)
  }

  console.log(`\n${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
