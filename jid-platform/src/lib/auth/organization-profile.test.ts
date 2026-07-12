import { describe, expect, it } from 'vitest'
import {
  checkOrganizationProfile,
  organizationProfileFallbackRedirect,
} from '@/lib/auth/organization-profile'

/**
 * P-109 Task 5 — lifecycle redirect trace (mocked Supabase, no RLS harness).
 * Confirms checkOrganizationProfile() mapping for business org type.
 */
function mockSupabase(scenario: {
  profile?: { id: string; status: string } | null
  verification?: { status: string; resulting_profile_id: string | null } | null
}) {
  const from = (table: string) => ({
    select: () => ({
      eq: (col: string, _val: string) => {
        if (table === 'business_profiles' && col === 'owner_user_id') {
          return {
            maybeSingle: async () => ({ data: scenario.profile ?? null, error: null }),
          }
        }
        if (table === 'verification_requests' && col === 'applicant_user_id') {
          return {
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({
                    data: scenario.verification ?? null,
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        return { maybeSingle: async () => ({ data: null, error: null }) }
      },
    }),
  })

  return { from } as unknown as Parameters<typeof checkOrganizationProfile>[2]
}

describe('checkOrganizationProfile (business)', () => {
  const userId = '00000000-0000-4000-8000-000000000099'

  it('state 1: no verification row → signup', async () => {
    const result = await checkOrganizationProfile(userId, 'business', mockSupabase({}))
    expect(result).toEqual({ satisfied: false, suggestedRedirect: '/signup/entity-type' })
  })

  it('state 2: pending verification → verification-pending', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'business',
      mockSupabase({ verification: { status: 'pending_review', resulting_profile_id: null } }),
    )
    expect(result).toEqual({
      satisfied: false,
      suggestedRedirect: '/company/verification-pending',
    })
  })

  it('state 3: rejected → verification-rejected', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'business',
      mockSupabase({ verification: { status: 'rejected', resulting_profile_id: null } }),
    )
    expect(result).toEqual({
      satisfied: false,
      suggestedRedirect: '/company/verification-rejected',
    })
  })

  it('state 4: approved without profile → create-profile', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'business',
      mockSupabase({ verification: { status: 'approved', resulting_profile_id: null } }),
    )
    expect(result).toEqual({ satisfied: false, suggestedRedirect: '/company/create-profile' })
  })

  it('state 5a: draft profile → satisfied', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'business',
      mockSupabase({ profile: { id: 'p1', status: 'draft' } }),
    )
    expect(result).toEqual({ satisfied: true })
  })

  it('state 5b: suspended profile → profile-suspended', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'business',
      mockSupabase({ profile: { id: 'p1', status: 'suspended' } }),
    )
    expect(result).toEqual({
      satisfied: false,
      suggestedRedirect: '/company/profile-suspended',
    })
  })

  it('fallback redirect for business', () => {
    expect(organizationProfileFallbackRedirect('business')).toBe('/company/verification-pending')
  })
})
