import { describe, expect, it, vi } from 'vitest'
import {
  checkOrganizationProfile,
  organizationProfileFallbackRedirect,
} from '@/lib/auth/organization-profile'
import { createBusinessProfile, createUniversityProfile } from '@/lib/auth/verification'

type OrgScenario = {
  profile?: { id: string; status: string } | null
  verification?: { status: string; resulting_profile_id: string | null } | null
}

function mockSupabase(orgType: 'business' | 'university', scenario: OrgScenario) {
  const profileTable = orgType === 'business' ? 'business_profiles' : 'university_profiles'

  const from = (table: string) => ({
    select: () => ({
      eq: (col: string, _val: string) => {
        if (table === profileTable && col === 'owner_user_id') {
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

  it('1 — unverified business user cannot reach create-profile (no verification)', async () => {
    const result = await checkOrganizationProfile(userId, 'business', mockSupabase('business', {}))
    expect(result).toEqual({ satisfied: false, suggestedRedirect: '/signup/entity-type' })
  })

  it('state 2: pending verification → verification-pending', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'business',
      mockSupabase('business', {
        verification: { status: 'pending_review', resulting_profile_id: null },
      }),
    )
    expect(result).toEqual({
      satisfied: false,
      suggestedRedirect: '/company/verification-pending',
    })
  })

  it('11 — rejected business → verification-rejected', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'business',
      mockSupabase('business', {
        verification: { status: 'rejected', resulting_profile_id: null },
      }),
    )
    expect(result).toEqual({
      satisfied: false,
      suggestedRedirect: '/company/verification-rejected',
    })
  })

  it('2 — approved business without profile → create-profile', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'business',
      mockSupabase('business', {
        verification: { status: 'approved', resulting_profile_id: null },
      }),
    )
    expect(result).toEqual({ satisfied: false, suggestedRedirect: '/company/create-profile' })
  })

  it('12 — existing business profile owner → satisfied', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'business',
      mockSupabase('business', { profile: { id: 'p1', status: 'draft' } }),
    )
    expect(result).toEqual({ satisfied: true })
  })

  it('suspended business profile → profile-suspended', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'business',
      mockSupabase('business', { profile: { id: 'p1', status: 'suspended' } }),
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

describe('checkOrganizationProfile (university)', () => {
  const userId = '00000000-0000-4000-8000-000000000088'

  it('5 — unverified university user cannot reach create-profile', async () => {
    const result = await checkOrganizationProfile(userId, 'university', mockSupabase('university', {}))
    expect(result).toEqual({ satisfied: false, suggestedRedirect: '/signup/entity-type' })
  })

  it('11 — pending university → pending-review', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'university',
      mockSupabase('university', {
        verification: { status: 'under_review', resulting_profile_id: null },
      }),
    )
    expect(result).toEqual({ satisfied: false, suggestedRedirect: '/university/pending-review' })
  })

  it('11 — rejected university → rejected', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'university',
      mockSupabase('university', {
        verification: { status: 'rejected', resulting_profile_id: null },
      }),
    )
    expect(result).toEqual({ satisfied: false, suggestedRedirect: '/university/rejected' })
  })

  it('6 — approved university without profile → create-profile (loop removed)', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'university',
      mockSupabase('university', {
        verification: { status: 'approved', resulting_profile_id: null },
      }),
    )
    expect(result).toEqual({ satisfied: false, suggestedRedirect: '/university/create-profile' })
  })

  it('8 — approved university no longer loops to pending-review', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'university',
      mockSupabase('university', {
        verification: { status: 'approved', resulting_profile_id: null },
      }),
    )
    expect(result.satisfied).toBe(false)
    if (!result.satisfied) {
      expect(result.suggestedRedirect).not.toBe('/university/pending-review')
      expect(result.suggestedRedirect).toBe('/university/create-profile')
    }
  })

  it('12 — existing university profile owner → satisfied', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'university',
      mockSupabase('university', { profile: { id: 'u1', status: 'draft' } }),
    )
    expect(result).toEqual({ satisfied: true })
  })

  it('suspended university profile → profile-suspended', async () => {
    const result = await checkOrganizationProfile(
      userId,
      'university',
      mockSupabase('university', { profile: { id: 'u1', status: 'suspended' } }),
    )
    expect(result).toEqual({
      satisfied: false,
      suggestedRedirect: '/university/profile-suspended',
    })
  })

  it('fallback redirect for university', () => {
    expect(organizationProfileFallbackRedirect('university')).toBe('/university/pending-review')
  })
})

describe('profile creation RPC guards (JID-102B)', () => {
  it('4 — duplicate business creation is denied by RPC', async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'profile_already_created' },
      }),
    } as unknown as Parameters<typeof createBusinessProfile>[0]

    await expect(
      createBusinessProfile(client, {
        verificationId: '00000000-0000-4000-8000-000000000001',
        displayNameAr: 'شركة',
      }),
    ).rejects.toThrow('profile_already_created')
  })

  it('9 — duplicate university creation is denied by RPC', async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'profile_already_created' },
      }),
    } as unknown as Parameters<typeof createUniversityProfile>[0]

    await expect(
      createUniversityProfile(client, {
        verificationId: '00000000-0000-4000-8000-000000000002',
        displayNameAr: 'جامعة',
      }),
    ).rejects.toThrow('profile_already_created')
  })

  it('10 — wrong verification type is denied by RPC', async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'wrong_verification_type' },
      }),
    } as unknown as Parameters<typeof createUniversityProfile>[0]

    await expect(
      createUniversityProfile(client, {
        verificationId: '00000000-0000-4000-8000-000000000003',
        displayNameAr: 'جامعة',
      }),
    ).rejects.toThrow('wrong_verification_type')
  })

  it('2 — approved business can create draft profile via RPC', async () => {
    const profileId = '00000000-0000-4000-8000-000000000010'
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: profileId, error: null }),
    } as unknown as Parameters<typeof createBusinessProfile>[0]

    const id = await createBusinessProfile(client, {
      verificationId: '00000000-0000-4000-8000-000000000001',
      displayNameAr: 'شركة معتمدة',
    })

    expect(id).toBe(profileId)
    expect(client.rpc).toHaveBeenCalledWith('create_business_profile', {
      p_verification_id: '00000000-0000-4000-8000-000000000001',
      p_display_name_ar: 'شركة معتمدة',
      p_display_name_en: undefined,
    })
  })

  it('7 — approved university can create draft profile via RPC', async () => {
    const profileId = '00000000-0000-4000-8000-000000000011'
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: profileId, error: null }),
    } as unknown as Parameters<typeof createUniversityProfile>[0]

    const id = await createUniversityProfile(client, {
      verificationId: '00000000-0000-4000-8000-000000000002',
      displayNameAr: 'جامعة معتمدة',
      displayNameEn: 'Approved University',
    })

    expect(id).toBe(profileId)
    expect(client.rpc).toHaveBeenCalledWith('create_university_profile', {
      p_verification_id: '00000000-0000-4000-8000-000000000002',
      p_display_name_ar: 'جامعة معتمدة',
      p_display_name_en: 'Approved University',
    })
  })

  it('1 — unverified user denied at RPC (verification_not_approved)', async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'verification_not_approved' },
      }),
    } as unknown as Parameters<typeof createBusinessProfile>[0]

    await expect(
      createBusinessProfile(client, {
        verificationId: '00000000-0000-4000-8000-000000000001',
        displayNameAr: 'شركة',
      }),
    ).rejects.toThrow('verification_not_approved')
  })
})

describe('profile creation i18n parity (JID-102B)', () => {
  it('13 — AR/EN keys exist for university and business create-profile copy', async () => {
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const root = join(process.cwd(), 'messages')
    const enText = readFileSync(join(root, 'en.json'), 'utf8')
    const arText = readFileSync(join(root, 'ar.json'), 'utf8')
    const en = JSON.parse(enText) as Record<string, unknown>
    const ar = JSON.parse(arText) as Record<string, unknown>

    const enUni = (en.university as Record<string, unknown>).profileCreation as Record<string, string>
    const arUni = (ar.university as Record<string, unknown>).profileCreation as Record<string, string>

    for (const key of ['create', 'creating', 'created', 'createFailed', 'title']) {
      expect(enUni[key]).toBeTruthy()
      expect(arUni[key]).toBeTruthy()
      expect(enText).toMatch(new RegExp(`"profileCreation"[\\s\\S]*?"${key}"\\s*:`))
      expect(arText).toMatch(new RegExp(`"profileCreation"[\\s\\S]*?"${key}"\\s*:`))
    }
  })
})
