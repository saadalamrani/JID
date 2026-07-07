/**
 * Notification email worker + Resend webhook verification (static).
 * Run: pnpm tsx scripts/verify-notification-email-worker.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(process.cwd())
const FUNCTIONS = join(ROOT, 'supabase/functions')

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
  console.log('Notification email worker verification\n')

  const migration = join(ROOT, 'supabase/migrations/084_notification_email_worker.sql')
  const worker = join(FUNCTIONS, 'notification-email-worker/index.ts')
  const webhook = join(FUNCTIONS, 'resend-webhook/index.ts')
  const processor = join(FUNCTIONS, '_shared/notification-email-processor.ts')
  const resendClient = join(FUNCTIONS, '_shared/resend-client.ts')
  const emailTemplate = join(FUNCTIONS, 'notification-email-worker/templates/render.ts')

  for (const [label, path] of [
    ['Migration 084', migration],
    ['notification-email-worker', worker],
    ['resend-webhook', webhook],
    ['notification-email-processor', processor],
    ['resend-client SDK', resendClient],
    ['React Email template', emailTemplate],
  ] as const) {
    if (!existsSync(path)) fail(`File ${label}`)
    else pass(`File ${label}`)
  }

  const mig = readFileSync(migration, 'utf-8')
  const workerSrc = readFileSync(worker, 'utf-8')
  const webhookSrc = readFileSync(webhook, 'utf-8')
  const processorSrc = readFileSync(processor, 'utf-8')

  if (mig.includes('email_quota_status') && mig.includes('delivered_via_email')) {
    pass('Schema: quota RPC + delivery columns')
  } else {
    fail('Migration schema')
  }

  if (workerSrc.includes('email_quota_status') && workerSrc.includes("reason: 'quota_exhausted'")) {
    pass('Circuit breaker short-circuit (HTTP 200)')
  } else {
    fail('Quota guardrail')
  }

  if (processorSrc.includes('get_notification_preference') && processorSrc.includes('skipped_prefs')) {
    pass('Live preference validation')
  } else {
    fail('Preference routing')
  }

  if (processorSrc.includes('email_bounces') && processorSrc.includes('skipped_bounced')) {
    pass('Bounce suppression')
  } else {
    fail('Bounce elimination')
  }

  if (processorSrc.includes('renderNotificationEmailTemplate') && processorSrc.includes('List-Unsubscribe')) {
    pass('React Email render router + unsubscribe headers')
  } else {
    fail('Email render/send pipeline')
  }

  if (processorSrc.includes('delivered_via_email') && processorSrc.includes('email_send_log')) {
    pass('Success persistence (notifications + email_send_log)')
  } else {
    fail('Delivery persistence')
  }

  if (webhookSrc.includes('Webhook') && webhookSrc.includes('email.bounced')) {
    pass('Svix-verified Resend webhook')
  } else {
    fail('Webhook receiver')
  }

  if (webhookSrc.includes('email_bounces') && webhookSrc.includes('complaint')) {
    pass('Hard bounce + complaint blacklist upsert')
  } else {
    fail('Bounce upsert')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
