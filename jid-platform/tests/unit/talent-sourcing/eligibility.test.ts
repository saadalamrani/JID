import { describe, expect, it } from 'vitest'
import { invitationCreatesApplication, isProfessionallyDiscoverable } from '@/lib/talent-sourcing/eligibility'
import { canInviteDiscoverableTalent, canSearchDiscoverableTalent } from '@/lib/talent-sourcing/eligibility'
import { DISCOVERABILITY_DOES_NOT_IMPLY } from '@/types/contracts/talent-sourcing'

describe('professional discoverability', () => {
  it('defaults to not discoverable', () => {
    expect(
      isProfessionallyDiscoverable({
        visibility: 'private',
        showProfileToCompanies: false,
        role: 'individual',
        profileState: 'active',
      }),
    ).toBe(false)
  })

  it('requires both discoverable visibility and employer opt-in', () => {
    expect(
      isProfessionallyDiscoverable({
        visibility: 'discoverable',
        showProfileToCompanies: false,
        role: 'individual',
        profileState: 'active',
      }),
    ).toBe(false)
    expect(
      isProfessionallyDiscoverable({
        visibility: 'private',
        showProfileToCompanies: true,
        role: 'individual',
        profileState: 'active',
      }),
    ).toBe(false)
    expect(
      isProfessionallyDiscoverable({
        visibility: 'discoverable',
        showProfileToCompanies: true,
        role: 'individual',
        profileState: 'active',
      }),
    ).toBe(true)
  })

  it('hides suspended or non-individual profiles', () => {
    expect(
      isProfessionallyDiscoverable({
        visibility: 'discoverable',
        showProfileToCompanies: true,
        role: 'university_admin',
        profileState: 'active',
      }),
    ).toBe(false)
    expect(
      isProfessionallyDiscoverable({
        visibility: 'discoverable',
        showProfileToCompanies: true,
        role: 'individual',
        profileState: 'suspended',
      }),
    ).toBe(false)
  })
})

describe('verified employer boundary', () => {
  it('denies anon, unverified business, and members without workspace access', () => {
    expect(
      canSearchDiscoverableTalent({
        isAuthenticated: false,
        isStaff: false,
        isVerifiedApprovedBusiness: true,
        canReadHiringWorkspace: true,
        canWriteHiringWorkspace: true,
      }),
    ).toBe(false)
    expect(
      canSearchDiscoverableTalent({
        isAuthenticated: true,
        isStaff: false,
        isVerifiedApprovedBusiness: false,
        canReadHiringWorkspace: true,
        canWriteHiringWorkspace: true,
      }),
    ).toBe(false)
    expect(
      canInviteDiscoverableTalent({
        isAuthenticated: true,
        isStaff: false,
        isVerifiedApprovedBusiness: true,
        canReadHiringWorkspace: true,
        canWriteHiringWorkspace: false,
      }),
    ).toBe(false)
  })
})

describe('discovery contract', () => {
  it('keeps discoverable, invited, and applied as separate states', () => {
    expect(invitationCreatesApplication('INVITED')).toBe(false)
    expect(invitationCreatesApplication('INTERESTED')).toBe(false)
    expect(DISCOVERABILITY_DOES_NOT_IMPLY).toContain('SEEKING_WORK')
    expect(DISCOVERABILITY_DOES_NOT_IMPLY).toContain('HIGH_MATCH')
  })
})
