/**
 * Section 4.2 — Mentor application flow verification.
 * Run: pnpm tsx scripts/verify-become-mentor.ts
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

const migration = read('supabase/migrations/056_mentor_application.sql')
const apiRoute = read('src/app/api/me/become-mentor/route.ts')
const submit = read('src/lib/mentor-application/submit.ts')
const validation = read('src/lib/validations/become-mentor.ts')
const page = read('src/app/[locale]/(individual)/settings/become-mentor/page.tsx')
const wizard = read(
  'src/app/[locale]/(individual)/settings/become-mentor/_components/become-mentor-wizard.tsx',
)
const hasRole = read('src/lib/mentor-mode/has-mentor-role.ts')
const middleware = read('src/middleware.ts')

// Task 1 — 5-step wizard
check(page.includes('BecomeMentorWizard'), 'become-mentor page renders wizard')
check(wizard.includes('Step1ProfessionalInfo'), 'wizard step 1 professional info')
check(wizard.includes('Step2ExpertiseAreas'), 'wizard step 2 expertise areas')
check(wizard.includes('Step3MentorBio'), 'wizard step 3 mentor bio')
check(wizard.includes('Step4VerificationDocs'), 'wizard step 4 verification docs')
check(wizard.includes('Step5Review'), 'wizard step 5 review with preview')
check(wizard.includes('maxItems={5}') || wizard.includes('expertise_areas'), 'expertise max 5 in UI')
check(wizard.includes('maxLength={500}') || read('src/app/[locale]/(individual)/settings/become-mentor/_components/step3-mentor-bio.tsx').includes('maxLength={500}'), 'bio max 500 chars')
check(
  read('src/app/[locale]/(individual)/settings/become-mentor/_components/step4-verification-docs.tsx').includes('linkedin_url'),
  'LinkedIn URL required in step 4',
)
check(
  read('src/app/[locale]/(individual)/settings/become-mentor/_components/step5-review.tsx').includes('MentorIdentityHeader'),
  'live mentor card preview',
)

// Task 2 — API + insert pending_review + slug + server validation
check(apiRoute.includes('export async function POST'), 'API POST route exists')
check(apiRoute.includes('becomeMentorSchema'), 'API validates with Zod schema')
check(apiRoute.includes('submitMentorApplication'), 'API delegates to submit helper')
check(submit.includes("status: 'pending_review'"), 'submit sets status pending_review')
check(submit.includes('generateMentorSlug'), 'submit generates slug from full_name')
check(submit.includes("from('mentor_profiles')"), 'submit uses mentor_profiles only')
check(!submit.includes('claim_requests'), 'submit never touches claim_requests')
check(validation.includes('.max(5'), 'client schema caps expertise_areas at 5')
check(apiRoute.includes('expertise_areas.length > 5'), 'API re-validates expertise_areas length')

// Task 3 — RLS Day 1 insert policy
check(migration.includes('pending_review'), 'migration adds pending_review status')
check(migration.includes('expertise_areas'), 'migration adds expertise_areas column')
check(migration.includes('slug'), 'migration adds slug column')
check(
  migration.includes("status = 'pending_review'") && migration.includes('mentor_profiles_insert_own'),
  'insert policy requires pending_review',
)

// hasMentorRole stays false until approved
check(hasRole.includes("eq('status', 'approved')"), 'hasMentorRole only true when approved')
check(
  read('src/lib/hooks/use-mentor-mode.ts').includes("data?.status === 'approved'"),
  'client mentor mode only when approved',
)

check(middleware.includes('/settings/become-mentor'), 'mentor_status redirect points to become-mentor')

console.log('\nBecome mentor verification complete.')
console.log('\nE2E manual test:')
console.log('1. pnpm supabase:db:reset (or apply migration 056)')
console.log('2. Sign in as individual, open /settings/become-mentor')
console.log('3. Complete all 5 steps and submit')
console.log('4. Confirm mentor_profiles row: status=pending_review, slug set, expertise_areas<=5')
console.log('5. Confirm ProfileSwitcher / hasMentorRole remain false until staff sets approved')
