/**
 * TEMPORARY — Section 9 RBAC matrix smoke tests for canViewerSeeProfile.
 * Run: pnpm tsx scripts/profile-visibility-scratch.ts
 * Delete before Day 3 pages ship.
 */

import {
  canViewerSeeProfile,
  createAnonymousViewer,
  type ProfileViewer,
} from '../src/lib/profile/visibility-rules'
import type { ProfileVisibilityInput } from '../src/lib/profile/types'
import { calculateProfileCompletionPct, COMPLETION_TOTAL } from '../src/lib/profile/completion-calculator'

const TARGET_ID = '00000000-0000-4000-8000-000000000099'
const OTHER_ID = '00000000-0000-4000-8000-000000000001'

function baseProfile(overrides: Partial<ProfileVisibilityInput> = {}): ProfileVisibilityInput {
  return {
    id: TARGET_ID,
    visibility: 'private',
    show_profile_to_companies: false,
    suspended_at: null,
    deleted_at: null,
    profile_state: 'active',
    ...overrides,
  }
}

function viewer(overrides: Partial<ProfileViewer> = {}): ProfileViewer {
  return {
    userId: OTHER_ID,
    role: 'individual',
    companyId: null,
    isVerified: false,
    isAdmin: false,
    isMentorApproved: false,
    ...overrides,
  }
}

type Case = {
  name: string
  viewer: ProfileViewer
  profile: ProfileVisibilityInput
  expected: boolean
}

const cases: Case[] = [
  {
    name: 'owner sees own private profile',
    viewer: viewer({ userId: TARGET_ID, role: 'individual' }),
    profile: baseProfile({ visibility: 'private' }),
    expected: true,
  },
  {
    name: 'owner sees own suspended profile',
    viewer: viewer({ userId: TARGET_ID, role: 'individual' }),
    profile: baseProfile({ suspended_at: new Date().toISOString(), profile_state: 'suspended' }),
    expected: true,
  },
  {
    name: 'staff sees suspended profile',
    viewer: viewer({ role: 'staff', isAdmin: true }),
    profile: baseProfile({ suspended_at: new Date().toISOString(), profile_state: 'suspended' }),
    expected: true,
  },
  {
    name: 'super_admin sees private profile',
    viewer: viewer({ role: 'super_admin', isAdmin: true }),
    profile: baseProfile({ visibility: 'private' }),
    expected: true,
  },
  {
    name: 'verified HR sees discoverable + show_profile_to_companies',
    viewer: viewer({
      role: 'company_admin',
      companyId: '00000000-0000-4000-8000-000000000010',
      isVerified: true,
    }),
    profile: baseProfile({ visibility: 'discoverable', show_profile_to_companies: true }),
    expected: true,
  },
  {
    name: 'verified HR blocked when show_profile_to_companies=false',
    viewer: viewer({
      role: 'company_admin',
      companyId: '00000000-0000-4000-8000-000000000010',
      isVerified: true,
    }),
    profile: baseProfile({ visibility: 'discoverable', show_profile_to_companies: false }),
    expected: false,
  },
  {
    name: 'verified HR blocked on private profile',
    viewer: viewer({
      role: 'company_admin',
      companyId: '00000000-0000-4000-8000-000000000010',
      isVerified: true,
    }),
    profile: baseProfile({ visibility: 'private', show_profile_to_companies: true }),
    expected: false,
  },
  {
    name: 'verified HR blocked on suspended profile',
    viewer: viewer({
      role: 'company_admin',
      companyId: '00000000-0000-4000-8000-000000000010',
      isVerified: true,
    }),
    profile: baseProfile({
      visibility: 'discoverable',
      show_profile_to_companies: true,
      suspended_at: new Date().toISOString(),
      profile_state: 'suspended',
    }),
    expected: false,
  },
  {
    name: 'unverified company_admin cannot see discoverable',
    viewer: viewer({ role: 'company_admin', isVerified: false }),
    profile: baseProfile({ visibility: 'discoverable', show_profile_to_companies: true }),
    expected: false,
  },
  {
    name: 'approved mentor sees discoverable profile',
    viewer: viewer({ isMentorApproved: true }),
    profile: baseProfile({ visibility: 'discoverable' }),
    expected: true,
  },
  {
    name: 'approved mentor blocked on private profile',
    viewer: viewer({ isMentorApproved: true }),
    profile: baseProfile({ visibility: 'private' }),
    expected: false,
  },
  {
    name: 'mentor cannot bypass via show_profile_to_companies alone (Section 13)',
    viewer: viewer({ isMentorApproved: true }),
    profile: baseProfile({ visibility: 'private', show_profile_to_companies: true }),
    expected: false,
  },
  {
    name: 'plain individual blocked on others private profile',
    viewer: viewer({ role: 'individual' }),
    profile: baseProfile({ visibility: 'private' }),
    expected: false,
  },
  {
    name: 'plain individual blocked on others discoverable profile',
    viewer: viewer({ role: 'individual' }),
    profile: baseProfile({ visibility: 'discoverable', show_profile_to_companies: true }),
    expected: false,
  },
  {
    name: 'anonymous viewer sees public profile',
    viewer: createAnonymousViewer(),
    profile: baseProfile({ visibility: 'public' }),
    expected: true,
  },
  {
    name: 'anonymous viewer blocked on discoverable profile',
    viewer: createAnonymousViewer(),
    profile: baseProfile({ visibility: 'discoverable', show_profile_to_companies: true }),
    expected: false,
  },
  {
    name: 'non-staff blocked on deleted profile (no leak)',
    viewer: viewer({ role: 'individual' }),
    profile: baseProfile({ visibility: 'public', deleted_at: new Date().toISOString(), profile_state: 'deleted' }),
    expected: false,
  },
]

let failed = 0

for (const testCase of cases) {
  const actual = canViewerSeeProfile(testCase.viewer, testCase.profile)
  const ok = actual === testCase.expected
  if (!ok) {
    failed += 1
    console.error(`FAIL: ${testCase.name} — expected ${testCase.expected}, got ${actual}`)
  } else {
    console.log(`PASS: ${testCase.name}`)
  }
}

const completionSample = calculateProfileCompletionPct({
  avatar_url: 'https://cdn.example/a.png',
  headline: 'Engineer',
  about_me: 'About',
  university_id: 'u1',
  college_id: 'c1',
  skill_count: 2,
  target_sectors: ['tech'],
  linkedin_url: 'https://linkedin.com/in/x',
})

if (completionSample !== 100) {
  failed += 1
  console.error(`FAIL: completion calculator expected 100, got ${completionSample}`)
} else if (COMPLETION_TOTAL !== 100) {
  failed += 1
  console.error(`FAIL: COMPLETION_TOTAL should be 100, got ${COMPLETION_TOTAL}`)
} else {
  console.log('PASS: completion calculator mirrors SQL weights (100%)')
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}

console.log(`\nAll ${cases.length + 1} visibility/completion checks passed.`)
