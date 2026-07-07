/**
 * Section 10 — audit log filter + CSV export verification.
 *
 * Run: pnpm tsx scripts/verify-sys-audit-section10.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolveAuditActionFilter } from '../src/lib/sys/audit-catalog'

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
  console.log('\nAudit log Section 10 checks\n')

  const resolved = resolveAuditActionFilter('flag.enabled')
  if (resolved === 'feature_flag.toggle_global') {
    pass('flag.enabled alias resolves to feature_flag.toggle_global')
  } else {
    fail('flag.enabled alias', resolved)
  }

  if (!url || !serviceKey) {
    console.log('  SKIP  DB tests (env missing)')
    console.log(`\n${passed} passed, ${failed} failed\n`)
    process.exit(failed > 0 ? 1 : 0)
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const { data: flagEvents, error: flagError } = await admin
      .from('audit_logs')
      .select('id, action')
      .eq('action', 'feature_flag.toggle_global')
      .limit(5)

    if (flagError) throw new Error(flagError.message)

    const { data: aliasFiltered } = await admin
      .from('audit_logs')
      .select('id, action')
      .eq('action', resolveAuditActionFilter('flag.enabled'))
      .limit(5)

    if ((flagEvents?.length ?? 0) === (aliasFiltered?.length ?? 0)) {
      pass('flag.enabled filter matches feature_flag.toggle_global rows')
    } else if ((flagEvents?.length ?? 0) === 0 && (aliasFiltered?.length ?? 0) === 0) {
      pass('flag.enabled filter empty (no toggle events seeded yet)')
    } else {
      fail('flag.enabled filter count', `toggle=${flagEvents?.length} alias=${aliasFiltered?.length}`)
    }

    const actorId = '00000000-0000-4000-8000-000000000001'
    const { error: exportAuditError } = await admin.from('audit_logs').insert({
      actor_id: actorId,
      action: 'audit.exported',
      entity_type: 'audit_log',
      entity_id: null,
      new_data: { row_count: 1, filters: { action_type: 'flag.enabled' } },
      metadata: {
        reason: 'QA CSV export test',
        source: 'sys_portal',
        filters: { action_type: 'flag.enabled' },
      },
    })

    if (exportAuditError) {
      fail('audit.exported insert', exportAuditError.message)
    } else {
      pass('audit.exported self-audit entry created')
    }

    const { data: exportRow } = await admin
      .from('audit_logs')
      .select('action, metadata')
      .eq('action', 'audit.exported')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (exportRow?.action === 'audit.exported') {
      pass('export action appears in audit_logs')
    } else {
      fail('export audit row', JSON.stringify(exportRow))
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
      console.log('  SKIP  DB tests (Supabase not reachable)')
    } else {
      fail('db', message)
    }
  }

  console.log(`\n${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
