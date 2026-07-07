/**
 * Unified Notifications Section 4 — dispatcher verification (static).
 * Run: pnpm tsx scripts/verify-notification-dispatcher.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(process.cwd())
const MIGRATION = join(ROOT, 'supabase/migrations/082_notification_dispatcher.sql')
const TYPES = join(ROOT, 'src/lib/supabase/types.ts')

let passed = 0
let failed = 0

function pass(label: string) {
  passed += 1
  console.log(`  PASS  ${label}`)
}

function fail(label: string, detail?: string) {
  failed += 1
  console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
}

function main() {
  console.log('Unified Notifications — Section 4 dispatcher verification\n')

  if (!existsSync(MIGRATION)) {
    fail('Migration file exists', MIGRATION)
    process.exit(1)
  }

  const sql = readFileSync(MIGRATION, 'utf-8')
  const types = readFileSync(TYPES, 'utf-8')

  if (sql.includes('CREATE OR REPLACE FUNCTION public.dispatch_notification')) {
    pass('dispatch_notification function')
  } else {
    fail('dispatch_notification function')
  }

  if (sql.includes('SECURITY DEFINER') && sql.includes('SET search_path = public')) {
    pass('SECURITY DEFINER + search_path = public')
  } else {
    fail('SECURITY DEFINER + search_path')
  }

  if (sql.includes('idempotency_key = p_idempotency_key')) {
    pass('Idempotency check before insert')
  } else {
    fail('Idempotency check')
  }

  if (sql.includes('get_notification_preference(p_recipient_id, p_category)')) {
    pass('Preference fetch via get_notification_preference')
  } else {
    fail('Preference fetch')
  }

  if (sql.includes("pg_notify('email_queue'")) {
    pass('Email queue pg_notify signaling')
  } else {
    fail('pg_notify email_queue')
  }

  if (sql.includes('include_in_digest')) {
    pass('Digest deferral gate on email signal')
  } else {
    fail('Digest deferral gate')
  }

  if (sql.includes('GRANT EXECUTE ON FUNCTION public.dispatch_notification')) {
    pass('GRANT EXECUTE dispatch_notification → authenticated')
  } else {
    fail('GRANT EXECUTE dispatch_notification')
  }

  const wrappers = ['notify_claim_decision', 'notify_radar_status_change'] as const
  for (const fn of wrappers) {
    if (sql.includes(`FUNCTION public.${fn}`)) pass(`Wrapper ${fn}`)
    else fail(`Wrapper ${fn}`)
  }

  if (sql.includes('v_claim.user_id = auth.uid()')) {
    pass('notify_claim_decision blocks claimant self-dispatch')
  } else {
    fail('claimant auth.uid() guard')
  }

  if (sql.includes("v_priority := 'high'") && sql.includes('claim.approved')) {
    pass('notify_claim_decision escalates approve/reject priority')
  } else {
    fail('claim priority escalation')
  }

  if (sql.includes('radar.status:%s:%s')) {
    pass('notify_radar idempotency key radar.status:{cardId}:{newStatus}')
  } else {
    fail('radar idempotency key pattern')
  }

  if (sql.includes('CREATE OR REPLACE VIEW public.radar_cards')) {
    pass('radar_cards view')
  } else {
    fail('radar_cards view')
  }

  if (sql.includes('FROM public.radar_cards')) {
    pass('notify_radar_status_change queries radar_cards')
  } else {
    fail('radar_cards lookup in wrapper')
  }

  if (sql.includes('trg_notify_on_radar_change') && sql.includes('AFTER UPDATE OF status')) {
    pass('AFTER UPDATE trigger on status changes')
  } else {
    fail('radar change trigger')
  }

  if (sql.includes('status_changed_by = NEW.applicant_id')) {
    pass('Trigger skips applicant self-initiated moves')
  } else {
    fail('Self-initiated skip guard')
  }

  if (types.includes('dispatch_notification:') && types.includes('notify_claim_decision:')) {
    pass('TypeScript types include dispatcher RPCs')
  } else {
    fail('TypeScript types sync')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
