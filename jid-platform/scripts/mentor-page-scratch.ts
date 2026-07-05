/**
 * Scratch checks for mentor public page gates (no DB required).
 * Run: pnpm tsx scripts/mentor-page-scratch.ts
 */

import type { ProfileViewer } from '../src/lib/profile/types'

const APPROVED_ID = 'e0000000-0000-4000-8000-000000000001'
const PENDING_ID = 'e0000000-0000-4000-8000-000000000002'

const anonymous: ProfileViewer = {
  userId: null,
  role: null,
  companyId: null,
  isVerified: false,
  isAdmin: false,
  isMentorApproved: false,
}

const individualMentee: ProfileViewer = {
  userId: 'mentee-user',
  role: 'individual',
  companyId: null,
  isVerified: false,
  isAdmin: false,
  isMentorApproved: false,
}

const staffViewer: ProfileViewer = {
  userId: 'staff-user',
  role: 'staff',
  companyId: null,
  isVerified: false,
  isAdmin: true,
  isMentorApproved: false,
}

function canViewMentor(status: string, viewer: ProfileViewer): boolean {
  const isStaff = viewer.isAdmin
  if (status === 'approved') return true
  return isStaff
}

function isOwner(mentorUserId: string, viewer: ProfileViewer): boolean {
  return viewer.userId === mentorUserId
}

function isMentee(mentorUserId: string, viewer: ProfileViewer): boolean {
  return viewer.userId !== null && viewer.role === 'individual' && viewer.userId !== mentorUserId
}

let passed = 0
let failed = 0

function assert(label: string, condition: boolean) {
  if (condition) {
    passed += 1
    console.log(`  ✓ ${label}`)
  } else {
    failed += 1
    console.error(`  ✗ ${label}`)
  }
}

console.log('Mentor page scratch checks\n')

assert('anonymous sees approved mentor', canViewMentor('approved', anonymous))
assert('anonymous blocked from pending mentor', !canViewMentor('pending', anonymous))
assert('staff sees pending mentor', canViewMentor('pending', staffViewer))
assert('individual mentee sees approved mentor', canViewMentor('approved', individualMentee))
assert('mentee CTA for individual viewer', isMentee(APPROVED_ID, individualMentee))
assert('no mentee CTA for anonymous', !isMentee(APPROVED_ID, anonymous))
assert('owner detected', isOwner(APPROVED_ID, { ...individualMentee, userId: APPROVED_ID }))
assert('rejected status blocked for anonymous', !canViewMentor('rejected', anonymous))

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
