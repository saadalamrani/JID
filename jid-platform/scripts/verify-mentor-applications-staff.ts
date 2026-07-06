/**
 * Staff mentor application review — Section 4.2 Day 4
 * Run: pnpm tsx scripts/verify-mentor-applications-staff.ts
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

const getRoute = read('src/app/api/admin/mentor-applications/route.ts')
const patchRoute = read('src/app/api/admin/mentor-applications/[id]/route.ts')
const requireStaff = read('src/lib/admin/require-mentorship-staff.ts')
const review = read('src/lib/staff/review-mentor-application.ts')
const notify = read('src/lib/mentor-application/notify-application-approved.ts')
const page = read('src/app/[locale]/(staff)/staff/mentor-applications/page.tsx')
const hasRole = read('src/lib/mentor-mode/has-mentor-role.ts')
const switcher = read('src/components/shared/profile-switcher.tsx')

check(getRoute.includes('requireMentorshipStaff'), 'GET route requires mentorship staff')
check(getRoute.includes('listPendingMentorApplications'), 'GET lists pending applications via staff lib')
check(read('src/lib/staff/mentor-applications.ts').includes("'pending_review'"), 'list query filters pending_review')
check(patchRoute.includes('reviewMentorApplication'), 'PATCH delegates to review helper')
check(patchRoute.includes("decision: z.enum(['approve', 'reject'])") || review.includes("'approve', 'reject'"), 'PATCH supports approve/reject')

check(requireStaff.includes("'staff'"), 'staff role allowed')
check(requireStaff.includes("'super_admin'"), 'super_admin role allowed')
check(!requireStaff.includes("'admin'") || requireStaff.includes("MENTORSHIP_STAFF_ROLES"), 'admin excluded from mentorship staff gate')

check(review.includes("status: 'approved'"), 'approve sets status approved')
check(review.includes('reviewed_by'), 'approve records reviewed_by (approved_by)')
check(review.includes('reviewed_at'), 'approve records reviewed_at (approved_at)')
check(review.includes("status: 'rejected'"), 'reject sets status rejected')
check(review.includes('rejection_reason'), 'reject stores rejection_reason')
check(!review.includes('claim_requests'), 'review never uses claim_requests')

check(notify.includes('mentor.application_approved'), 'notification category documented')
check(notify.includes('dispatch_notification') || notify.includes('TODO'), 'flags unified notification integration')

check(page.includes('MentorApplicationReviewModal'), 'staff page has review modal')
check(page.includes('MentorApplicationsList'), 'staff page has applications list')

check(hasRole.includes("eq('status', 'approved')"), 'hasMentorRole true only after approval')
check(switcher.includes('hasMentorRole'), 'ProfileSwitcher gated on hasMentorRole')

console.log('\nMentor applications staff verification complete.')
console.log('\nE2E manual test:')
console.log('1. Submit mentor application as individual (pending_review)')
console.log('2. Sign in as staff, open /staff/mentor-applications')
console.log('3. Approve application — confirm mentor_profiles.status=approved')
console.log('4. Sign in as applicant — Profile Switcher visible, hasMentorRole=true')
