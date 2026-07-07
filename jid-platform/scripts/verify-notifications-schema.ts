/**
 * Unified Notifications Section 3 — schema verification (static).
 * Run: pnpm tsx scripts/verify-notifications-schema.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(process.cwd())
const MIGRATION = join(ROOT, 'supabase/migrations/081_notifications_schema.sql')
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
  console.log('Unified Notifications — Section 3 schema verification\n')

  if (!existsSync(MIGRATION)) {
    fail('Migration file exists', MIGRATION)
    process.exit(1)
  }

  const sql = readFileSync(MIGRATION, 'utf-8')
  const types = readFileSync(TYPES, 'utf-8')

  const enums = [
    'notification_category_enum',
    'notification_priority_enum',
    'email_send_status_enum',
  ]
  for (const e of enums) {
    if (sql.includes(e)) pass(`ENUM ${e}`)
    else fail(`ENUM ${e}`)
  }

  const tables = [
    'notifications',
    'notification_preferences',
    'email_send_log',
    'email_bounces',
    'digest_batches',
  ]
  for (const t of tables) {
    if (sql.includes(`CREATE TABLE IF NOT EXISTS public.${t}`)) pass(`Table ${t}`)
    else fail(`Table ${t}`)
  }

  const indexes = [
    'idx_notifications_recipient_unread',
    'idx_notifications_recipient_all',
    'idx_notifications_category',
    'idx_notifications_related',
    'idx_notifications_idempotency_key',
  ]
  for (const idx of indexes) {
    if (sql.includes(idx)) pass(`Index ${idx}`)
    else fail(`Index ${idx}`)
  }

  if (sql.includes('REFERENCES auth.users')) pass('FK recipient → auth.users')
  else fail('auth.users FK')

  if (sql.includes('notifications_idempotency_key_unique')) pass('UNIQUE idempotency_key constraint')
  else fail('idempotency_key UNIQUE')

  const helpers = [
    'get_default_email_pref',
    'get_default_digest_pref',
    'is_category_mandatory',
    'get_notification_preference',
  ]
  for (const fn of helpers) {
    if (sql.includes(fn)) pass(`Function ${fn}`)
    else fail(`Function ${fn}`)
  }

  if (sql.includes("'auth.email_verified'") && sql.includes("'digest.daily_summary'")) {
    pass('Category enum spans auth.email_verified → digest.daily_summary')
  } else {
    fail('Category enum range')
  }

  if (sql.includes('notifications_select_own') && !sql.includes('notifications_insert')) {
    pass('notifications RLS: SELECT/UPDATE only (no INSERT policy)')
  } else {
    fail('notifications INSERT blocked via RLS')
  }

  if (sql.includes("current_user_role() = 'super_admin'")) {
    pass('email_send_log / email_bounces super_admin RLS')
  } else {
    fail('super_admin RLS')
  }

  if (types.includes('notifications:') && types.includes('notification_category_enum')) {
    pass('TypeScript types include notifications schema')
  } else {
    fail('TypeScript types sync')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
