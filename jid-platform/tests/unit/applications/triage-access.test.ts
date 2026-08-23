import { describe, expect, it } from 'vitest'
import {
  decideJobTriageAccess,
  type TriageJobRef,
  type TriageViewer,
} from '@/lib/applications/triage-access-decision'
import type { UserRole } from '@/lib/auth/rbac'

const PROFILE_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const PROFILE_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const COMPANY_A = '11111111-1111-4111-8111-111111111111'
const COMPANY_B = '22222222-2222-4222-8222-222222222222'
const JOB_A = '33333333-3333-4333-8333-333333333333'

function viewer(overrides: Partial<TriageViewer> & { role?: UserRole } = {}): TriageViewer {
  return {
    userId: 'user-owner',
    role: 'company_admin',
    isStaff: false,
    businessProfileId: PROFILE_A,
    companyId: COMPANY_A,
    ...overrides,
  }
}

function job(overrides: Partial<TriageJobRef> = {}): TriageJobRef {
  return {
    id: JOB_A,
    company_id: COMPANY_A,
    business_profile_id: PROFILE_A,
    title_ar: 'فرصة',
    title_en: 'Opportunity',
    application_deadline: null,
    applicant_count: 1,
    ...overrides,
  }
}

describe('decideJobTriageAccess — owned Profile contract', () => {
  it('allows the owner of the job’s business Profile', () => {
    expect(decideJobTriageAccess({ viewer: viewer(), job: job() })).toBe('allow')
  })

  it('denies another organization’s Profile owner even if Directory ids collide', () => {
    expect(
      decideJobTriageAccess({
        viewer: viewer({ businessProfileId: PROFILE_B, companyId: COMPANY_A }),
        job: job(),
      }),
    ).toBe('forbidden')
  })

  it('denies a non-owner with a different Directory company', () => {
    expect(
      decideJobTriageAccess({
        viewer: viewer({ businessProfileId: PROFILE_B, companyId: COMPANY_B }),
        job: job(),
      }),
    ).toBe('forbidden')
  })

  it('denies unverified/unauthorized viewers with no owned Profile', () => {
    expect(
      decideJobTriageAccess({
        viewer: viewer({ businessProfileId: null, companyId: null }),
        job: job(),
      }),
    ).toBe('forbidden')
  })

  it('denies Directory claimed_by-only viewers on Profile-anchored jobs', () => {
    expect(
      decideJobTriageAccess({
        viewer: viewer({ businessProfileId: null, companyId: COMPANY_A }),
        job: job({ business_profile_id: PROFILE_A }),
      }),
    ).toBe('forbidden')
  })

  it('returns unauthorized when there is no viewer', () => {
    expect(decideJobTriageAccess({ viewer: null, job: job() })).toBe('unauthorized')
  })

  it('returns not_found when the job is missing', () => {
    expect(decideJobTriageAccess({ viewer: viewer(), job: null })).toBe('not_found')
  })

  it('allows privileged staff on any job', () => {
    expect(
      decideJobTriageAccess({
        viewer: viewer({
          role: 'staff',
          isStaff: true,
          businessProfileId: null,
          companyId: null,
        }),
        job: job({ business_profile_id: PROFILE_B, company_id: COMPANY_B }),
      }),
    ).toBe('allow')
  })

  it('allows transitional claimed_by only when the job has no Profile anchor', () => {
    expect(
      decideJobTriageAccess({
        viewer: viewer({ businessProfileId: null, companyId: COMPANY_A }),
        job: job({ business_profile_id: null, company_id: COMPANY_A }),
      }),
    ).toBe('allow')
  })
})
