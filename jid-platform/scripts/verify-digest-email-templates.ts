/**
 * Digest engine + React Email templates verification (static).
 * Run: pnpm tsx scripts/verify-digest-email-templates.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(process.cwd())
const TEMPLATES = join(ROOT, 'supabase/functions/notification-email-worker/templates')

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
  console.log('Digest engine + email templates verification\n')

  const migration = join(ROOT, 'supabase/migrations/085_digest_cron_engine.sql')
  const files = [
    'base-layout.tsx',
    'render.ts',
    'generic-notification-email.tsx',
    'claim-approved-email.tsx',
    'radar-status-email.tsx',
    'digest-email.tsx',
  ]

  if (!existsSync(migration)) fail('Migration 085')
  else pass('Migration 085')

  for (const file of files) {
    if (!existsSync(join(TEMPLATES, file))) fail(`Template ${file}`)
    else pass(`Template ${file}`)
  }

  const mig = readFileSync(migration, 'utf-8')
  const base = readFileSync(join(TEMPLATES, 'base-layout.tsx'), 'utf-8')
  const render = readFileSync(join(TEMPLATES, 'render.ts'), 'utf-8')
  const processor = readFileSync(
    join(ROOT, 'supabase/functions/_shared/notification-email-processor.ts'),
    'utf-8',
  )

  if (base.includes('#F7F5EF') && base.includes("@react-email/components")) {
    pass('Base layout uses @react-email/components + brand background')
  } else {
    fail('Base layout shell')
  }

  if (!base.includes('letter-spacing') && !base.includes('letterSpacing')) {
    pass('No letter-spacing styles in base layout')
  } else {
    fail('letter-spacing must not be embedded')
  }

  if (render.includes('digest.daily_summary') && render.includes('ClaimApprovedEmail')) {
    pass('render.ts category router')
  } else {
    fail('Template router')
  }

  if (mig.includes('build_daily_digests') && mig.includes('included_in_digest_id')) {
    pass('build_daily_digests + digest linkage column')
  } else {
    fail('Digest PL/pgSQL function')
  }

  if (mig.includes("'daily-digest-build'") && mig.includes("'0 5 * * *'")) {
    pass('pg_cron 05:00 UTC (08:00 Riyadh)')
  } else {
    fail('Cron schedule')
  }

  if (mig.includes("pg_notify('email_queue'")) {
    pass('pg_notify email_queue on digest parent')
  } else {
    fail('Digest dispatch notify')
  }

  if (processor.includes('renderNotificationEmailTemplate') && processor.includes('loadDigestItems')) {
    pass('Processor wired to premium templates + digest items')
  } else {
    fail('Processor integration')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
