/**
 * Scratch checks for profile page display states (no DB required).
 * Run: pnpm tsx scripts/profile-page-scratch.ts
 */

import { resolveProfileDisplayState, toWizardInput } from '../src/lib/profile/display-state'
import { canViewerSeeProfile, createAnonymousViewer } from '../src/lib/profile/visibility-rules'
import { calculateWizardCompletionPct } from '../src/lib/profile/wizard-completion'
import type { ProfileRecord } from '../src/lib/profile/types'

const EMPTY_ID = 'a0000000-0000-4000-8000-000000000001'
const COMPLETE_ID = 'a0000000-0000-4000-8000-000000000002'
const SUSPENDED_ID = 'a0000000-0000-4000-8000-000000000003'

function baseProfile(overrides: Partial<ProfileRecord>): ProfileRecord {
  return {
    id: EMPTY_ID,
    full_name: 'Test',
    headline: null,
    about_me: null,
    avatar_url: null,
    target_sectors: [],
    target_program_types: [],
    target_regions: [],
    smart_links: {},
    profile_completion_pct: 0,
    profile_state: 'incomplete',
    visibility: 'private',
    show_profile_to_companies: false,
    show_profile_in_university_stats: false,
    suspended_at: null,
    deleted_at: null,
    university_id: null,
    college_id: null,
    linkedin_url: null,
    locale: 'ar',
    role: 'individual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

const emptyProfile = baseProfile({ id: EMPTY_ID, visibility: 'private' })

const incompleteProfile = baseProfile({
  id: COMPLETE_ID,
  visibility: 'public',
  profile_state: 'active',
  headline: 'Engineer',
  about_me: 'Bio',
  avatar_url: 'https://example.com/a.png',
  university_id: 'b0000000-0000-4000-8000-000000000001',
  target_sectors: ['Technology', 'Finance'],
  linkedin_url: null,
})

const suspendedProfile = baseProfile({
  id: SUSPENDED_ID,
  visibility: 'public',
  profile_state: 'suspended',
  suspended_at: new Date().toISOString(),
})

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

console.log('Profile page scratch checks\n')

const emptyInput = toWizardInput(emptyProfile, 0)
assert('empty profile → display state empty', resolveProfileDisplayState(emptyProfile, 0) === 'empty')
assert('empty wizard pct = 0', calculateWizardCompletionPct(emptyInput) === 0)
assert(
  'anonymous cannot see private empty profile',
  !canViewerSeeProfile(createAnonymousViewer(), emptyProfile),
)

const skillCount = 3
const incompleteInput = toWizardInput(incompleteProfile, skillCount)
const incompletePct = calculateWizardCompletionPct(incompleteInput)
assert('incomplete profile wizard pct >= 80', incompletePct >= 80 && incompletePct < 100)
assert(
  'incomplete profile → display state incomplete',
  resolveProfileDisplayState(incompleteProfile, skillCount) === 'incomplete',
)
assert(
  'anonymous can see public incomplete profile',
  canViewerSeeProfile(createAnonymousViewer(), incompleteProfile),
)

assert(
  'anonymous cannot see suspended profile (visibility gate)',
  !canViewerSeeProfile(createAnonymousViewer(), suspendedProfile),
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
