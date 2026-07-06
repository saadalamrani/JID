/**
 * Section 4.8 — RequestSessionModal + mentorship request API.
 * Run: pnpm tsx scripts/verify-mentorship-request.ts
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(process.cwd())

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

function check(ok: boolean, label: string) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`)
  if (!ok) process.exitCode = 1
}

const modal = read('src/components/mentorship/request-session-modal.tsx')
const button = read('src/components/mentorship/request-session-button.tsx')
const card = read('src/components/mentor/mentor-card.tsx')
const detail = read('src/app/[locale]/(public)/mentors/_components/mentor-public-detail-view.tsx')
const api = read('src/app/api/mentorship-requests/route.ts')
const submit = read('src/lib/mentorship/submit-mentorship-request.ts')
const snapshot = read('src/lib/mentorship/mentee-snapshot.ts')
const validation = read('src/lib/validations/mentorship-request.ts')
const migration = read('supabase/migrations/059_mentorship_request_context.sql')
const pendingApi = read('src/app/api/me/mentor/pending-requests/route.ts')

check(modal.includes('RequestSessionModal'), 'RequestSessionModal component exists')
check(modal.includes('snapshotTitle'), 'modal shows profile snapshot section')
check(modal.includes('intent-statement'), 'modal has intent statement field')
check(modal.includes('INTENT_STATEMENT_MIN_LENGTH'), 'modal enforces min length client-side')

check(button.includes('RequestSessionModal'), 'RequestSessionButton opens modal')
check(card.includes('RequestSessionButton'), 'MentorCard wires request button')
check(detail.includes('RequestSessionButton'), 'detail page wires request button')

check(api.includes('submitMentorshipRequest'), 'POST /api/mentorship-requests delegates to submit lib')
check(submit.includes('mentee_snapshot'), 'submit stores mentee_snapshot on insert')
check(submit.includes('buildMenteeSnapshot'), 'snapshot built server-side not from client')
check(submit.includes('INTENT_STATEMENT_MIN_LENGTH'), 'submit enforces intent min length server-side')
check(!submit.includes('body.snapshot'), 'submit does not trust client snapshot')

check(snapshot.includes('target_sectors'), 'snapshot uses target_sectors from profiles')
check(snapshot.includes('university_id'), 'snapshot resolves university from profiles')
check(snapshot.includes('college_id'), 'snapshot resolves college from profiles')
check(snapshot.includes('target_regions'), 'snapshot uses target_regions for city')
check(!snapshot.includes('graduation_year'), 'snapshot does not reference non-existent graduation_year')
check(!snapshot.includes('major'), 'snapshot uses college not non-existent major column')

check(validation.includes('50'), 'zod schema min 50 characters')
check(migration.includes('intent_statement'), 'migration adds intent_statement')
check(migration.includes('mentee_snapshot'), 'migration adds mentee_snapshot')
check(migration.includes('>= 50'), 'DB check constraint enforces min intent length')

check(pendingApi.includes('fetchMentorPendingRequests'), 'mentor pending queue API for Day 8')

console.log('\nMentorship request verification complete.')
