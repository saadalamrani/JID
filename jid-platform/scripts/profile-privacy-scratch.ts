/**
 * Privacy gate scratch checks (no DB).
 * Run: pnpm tsx scripts/profile-privacy-scratch.ts
 */

import { canViewerSeeProfile, createAnonymousViewer } from '../src/lib/profile/visibility-rules'
import type { ProfileRecord } from '../src/lib/profile/types'

function baseProfile(overrides: Partial<ProfileRecord>): ProfileRecord {
  return {
    id: 'test-user',
    full_name: 'Test',
    headline: 'Hi',
    about_me: 'Bio',
    avatar_url: null,
    target_sectors: [],
    target_program_types: [],
    target_regions: [],
    smart_links: {},
    profile_completion_pct: 50,
    profile_state: 'incomplete',
    visibility: 'discoverable',
    show_profile_to_companies: true,
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

const companyAdmin = {
  userId: 'hr-user',
  role: 'company_admin' as const,
  companyId: 'company-1',
  isVerified: true,
  isAdmin: false,
  isMentorApproved: false,
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

console.log('Profile privacy scratch checks\n')

const discoverable = baseProfile({ visibility: 'discoverable', show_profile_to_companies: true })
const privateProfile = baseProfile({ visibility: 'private', show_profile_to_companies: false })

assert('HR sees discoverable profile', canViewerSeeProfile(companyAdmin, discoverable))
assert('HR blocked from private profile', !canViewerSeeProfile(companyAdmin, privateProfile))
assert('anonymous blocked from private profile', !canViewerSeeProfile(createAnonymousViewer(), privateProfile))

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
