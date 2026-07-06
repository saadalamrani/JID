/**
 * Section 7.2 — verify job maintenance functions and email template rendering.
 * Run: pnpm tsx scripts/verify-job-cron-functions.ts
 *
 * Live DB test (Supabase SQL editor / psql):
 *   SELECT public.transition_closing_soon();
 *   SELECT public.expire_passed_jobs();
 *   SELECT public.expire_stale_applications();
 */

import {
  DEFAULT_REJECTION_TEMPLATE_AR,
  renderEmailTemplate,
} from '../src/lib/constants/email-templates'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('FAIL:', message)
    process.exit(1)
  }
}

const rendered = renderEmailTemplate(DEFAULT_REJECTION_TEMPLATE_AR, {
  applicant_name: 'أحمد',
  job_title: 'مهندس برمجيات',
  company_name: 'شركة تجريبية',
})

assert(rendered.includes('أحمد'), 'template renders applicant_name')
assert(rendered.includes('مهندس برمجيات'), 'template renders job_title')
assert(rendered.includes('شركة تجريبية'), 'template renders company_name')
assert(!rendered.includes('{applicant_name}'), 'no leftover placeholders')

console.log('PASS: rejection email template renders placeholders')
console.log('')
console.log('Manual cron verification (run against Supabase):')
console.log('  1. INSERT a job with status=published, deadline in 5 days → transition_closing_soon() → closing_soon')
console.log('  2. INSERT a job with status=published, deadline in past → expire_passed_jobs() → expired')
console.log('  3. PATCH application to rejected → send-rejection-email invoked within 30s (Section 9)')
console.log('')
console.log('Scheduled crons (migration 052):')
console.log("  transition-closing-soon  @ 0 * * * *")
console.log("  expire-passed-jobs      @ 5 * * * *")
console.log("  expire-stale-apps       @ 0 3 * * *")
console.log("  process-email-outbox    @ * * * * *")
