/**
 * Verify applicant status transition rules (Section 9) match client + Postgres guard.
 * Run: pnpm tsx scripts/verify-radar-mutations.ts
 */

import {
  isAllowedApplicantStatusTransition,
  isValidApplicantRadarArchive,
  statusForRadarColumnTransition,
} from '../src/lib/radar/applicant-status-transitions'
import { isValidManualDrop } from '../src/lib/radar/drag-rules'

import { hasUnseenCompanyStatusChange } from '../src/lib/hooks/use-glow-state'
import { getAllowedTargets } from '../src/lib/radar/drag-rules'

let passed = 0
let failed = 0

function check(label: string, condition: boolean) {
  if (condition) {
    passed += 1
    console.log(`  ✓ ${label}`)
  } else {
    failed += 1
    console.error(`  ✗ ${label}`)
  }
}

console.log('Radar mutation rules (Section 9)\n')

check('saved → archived maps to withdrawn', statusForRadarColumnTransition('saved', 'archived') === 'withdrawn')
check(
  'invited interview → archived maps to withdrawn',
  statusForRadarColumnTransition('under_review', 'archived') === 'withdrawn',
)
check('applied → archived has no status mapping', statusForRadarColumnTransition('applied', 'archived') === null)

check('saved → withdrawn allowed', isAllowedApplicantStatusTransition('saved', 'withdrawn'))
check('invited → withdrawn allowed', isAllowedApplicantStatusTransition('invited', 'withdrawn'))
check('saved → pending allowed (declare)', isAllowedApplicantStatusTransition('saved', 'pending'))
check('pending → invited blocked', !isAllowedApplicantStatusTransition('pending', 'invited'))
check('saved → shortlisted blocked', !isAllowedApplicantStatusTransition('saved', 'shortlisted'))
check('under_review → rejected blocked', !isAllowedApplicantStatusTransition('under_review', 'rejected'))

check(
  'saved archive is valid radar drop',
  isValidApplicantRadarArchive('saved', 'archived', 'saved', 'withdrawn'),
)
check(
  'invited archive is valid radar drop',
  isValidApplicantRadarArchive('under_review', 'archived', 'invited', 'withdrawn'),
)
check(
  'pending manual drop blocked',
  !isValidManualDrop('applied', 'archived', 'pending'),
)

check(
  'glow when status_changed_at > last_seen',
  hasUnseenCompanyStatusChange(
    {
      status_changed_at: '2026-07-06T12:00:00.000Z',
      last_seen_by_user_at: '2026-07-06T10:00:00.000Z',
      status_changed_by: 'company-user-id',
      applicant_id: 'applicant-id',
    },
    'applicant-id',
  ),
)
check(
  'no glow for own status change',
  !hasUnseenCompanyStatusChange(
    {
      status_changed_at: '2026-07-06T12:00:00.000Z',
      last_seen_by_user_at: null,
      status_changed_by: 'applicant-id',
      applicant_id: 'applicant-id',
    },
    'applicant-id',
  ),
)
check(
  'no glow after seen',
  !hasUnseenCompanyStatusChange(
    {
      status_changed_at: '2026-07-06T10:00:00.000Z',
      last_seen_by_user_at: '2026-07-06T12:00:00.000Z',
      status_changed_by: 'company-user-id',
      applicant_id: 'applicant-id',
    },
    'applicant-id',
  ),
)

check(
  'saved → archived allowed target',
  getAllowedTargets('saved', 'saved').includes('archived'),
)
check(
  'pending has no allowed targets',
  getAllowedTargets('applied', 'pending').length === 0,
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
