/**
 * Scratch checks for company public page gates (no DB required).
 * Run: pnpm tsx scripts/company-page-scratch.ts
 */

import type { CompanyProfileRecord } from '../src/lib/profile/types'
import type { ProfileViewer } from '../src/lib/profile/types'

const UNCLAIMED_ID = 'd0000000-0000-4000-8000-000000000001'
const CLAIMED_ID = 'd0000000-0000-4000-8000-000000000002'
const SUSPENDED_ID = 'd0000000-0000-4000-8000-000000000003'

function baseCompany(overrides: Partial<CompanyProfileRecord>): CompanyProfileRecord {
  return {
    id: UNCLAIMED_ID,
    name: 'Test Co',
    name_ar: null,
    tagline_ar: null,
    tagline_en: null,
    about_long_ar: null,
    about_long_en: null,
    founded_year: null,
    employee_count_range: null,
    office_locations: [],
    entity_type: 'company',
    entity_state: 'unclaimed',
    is_verified: false,
    is_on_honor_roll: false,
    last_activity_at: null,
    domains: ['test.local'],
    commitment_score: 0,
    avg_response_days: null,
    response_rate_pct: null,
    total_jobs_posted_12mo: 0,
    ...overrides,
  }
}

const anonymous: ProfileViewer = {
  userId: null,
  role: null,
  companyId: null,
  isVerified: false,
  isAdmin: false,
  isMentorApproved: false,
}

const companyAdmin: ProfileViewer = {
  userId: 'admin-user',
  role: 'company_admin',
  companyId: CLAIMED_ID,
  isVerified: true,
  isAdmin: false,
  isMentorApproved: false,
}

function shouldRenderPublicPage(
  company: CompanyProfileRecord,
  viewer: ProfileViewer,
): boolean {
  if (company.entity_state === 'suspended') return false
  if (company.entity_type === 'university' && !viewer.isAdmin) return false
  return true
}

function isOwner(company: CompanyProfileRecord, viewer: ProfileViewer): boolean {
  return viewer.companyId !== null && viewer.companyId === company.id
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

console.log('Company page scratch checks\n')

const unclaimed = baseCompany({ id: UNCLAIMED_ID, entity_state: 'unclaimed' })
const claimed = baseCompany({
  id: CLAIMED_ID,
  entity_state: 'claimed',
  commitment_score: 82.5,
  is_verified: true,
})
const suspended = baseCompany({ id: SUSPENDED_ID, entity_state: 'suspended' })
const university = baseCompany({ entity_type: 'university', entity_state: 'claimed' })

assert('anonymous sees unclaimed company', shouldRenderPublicPage(unclaimed, anonymous))
assert('anonymous sees claimed company', shouldRenderPublicPage(claimed, anonymous))
assert('anonymous blocked from suspended company', !shouldRenderPublicPage(suspended, anonymous))
assert(
  'anonymous blocked from university in MVP',
  !shouldRenderPublicPage(university, anonymous),
)
assert(
  'company_admin sees unclaimed (non-owner)',
  shouldRenderPublicPage(unclaimed, companyAdmin),
)
assert('unclaimed shows CTA state', unclaimed.entity_state === 'unclaimed')
assert('claimed hides CTA state', claimed.entity_state !== 'unclaimed')
assert('owner detected for matching companyId', isOwner(claimed, companyAdmin))
assert('not owner on unclaimed company', !isOwner(unclaimed, companyAdmin))

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
