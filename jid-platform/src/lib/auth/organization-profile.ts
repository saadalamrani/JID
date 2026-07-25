import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import {
  orgOutcomeRoutes,
  resolveVerificationOutcome,
} from '@/lib/entity/verification-outcome'

export type OrganizationType = 'business' | 'university'

export type OrganizationProfileCheckResult =
  | { satisfied: true }
  | { satisfied: false; suggestedRedirect: string }

/** Static fallback when dynamic redirect is unavailable (safety net per P-109). */
export function organizationProfileFallbackRedirect(orgType: OrganizationType): string {
  return orgOutcomeRoutes(orgType).pending
}

/**
 * P-109 — Ownership Law lifecycle guard (fast path: existing profile row).
 * Spec 03 §8 precedence via resolveVerificationOutcome.
 */
export async function checkOrganizationProfile(
  userId: string,
  orgType: OrganizationType,
  supabase: SupabaseClient<Database>,
): Promise<OrganizationProfileCheckResult> {
  const profileTable = orgType === 'business' ? 'business_profiles' : 'university_profiles'

  const { data: existingProfile } = await supabase
    .from(profileTable)
    .select('id, status')
    .eq('owner_user_id', userId)
    .maybeSingle()

  if (existingProfile) {
    const outcome = resolveVerificationOutcome({
      orgType,
      authenticated: true,
      profile: { status: existingProfile.status },
      verification: null,
    })
    if (outcome.kind === 'dashboard') {
      return { satisfied: true }
    }
    return { satisfied: false, suggestedRedirect: outcome.path }
  }

  const verificationType = orgType === 'business' ? 'business' : 'university'

  const { data: verification } = await supabase
    .from('verification_requests')
    .select('status, resulting_profile_id')
    .eq('applicant_user_id', userId)
    .eq('verification_type', verificationType)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const outcome = resolveVerificationOutcome({
    orgType,
    authenticated: true,
    profile: null,
    verification: verification
      ? {
          status: verification.status,
          resulting_profile_id: verification.resulting_profile_id,
        }
      : null,
  })

  return { satisfied: false, suggestedRedirect: outcome.path }
}
