import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export type OrganizationType = 'business' | 'university'

export type OrganizationProfileCheckResult =
  | { satisfied: true }
  | { satisfied: false; suggestedRedirect: string }

const PENDING_VERIFICATION_STATUSES = [
  'submitted',
  'pending_review',
  'pending',
  'under_review',
] as const

function orgPortalBase(orgType: OrganizationType): string {
  return orgType === 'business' ? '/company' : '/university'
}

/** Static fallback when dynamic redirect is unavailable (safety net per P-109). */
export function organizationProfileFallbackRedirect(orgType: OrganizationType): string {
  const base = orgPortalBase(orgType)
  if (orgType === 'business') {
    return `${base}/verification-pending`
  }
  return `${base}/pending-review`
}

function orgRoutes(orgType: OrganizationType) {
  const base = orgPortalBase(orgType)
  return {
    signup: '/signup/entity-type',
    pending:
      orgType === 'business' ? `${base}/verification-pending` : `${base}/pending-review`,
    rejected:
      orgType === 'business' ? `${base}/verification-rejected` : `${base}/rejected`,
    createProfile:
      orgType === 'business' ? `${base}/create-profile` : `${base}/pending-review`,
    suspended: `${base}/profile-suspended`,
  }
}

/**
 * P-109 — Ownership Law lifecycle guard (fast path: existing profile row).
 * Runs on every organization-portal guarded request.
 */
export async function checkOrganizationProfile(
  userId: string,
  orgType: OrganizationType,
  supabase: SupabaseClient<Database>,
): Promise<OrganizationProfileCheckResult> {
  const routes = orgRoutes(orgType)
  const profileTable = orgType === 'business' ? 'business_profiles' : 'university_profiles'

  const { data: existingProfile } = await supabase
    .from(profileTable)
    .select('id, status')
    .eq('owner_user_id', userId)
    .maybeSingle()

  if (existingProfile) {
    if (existingProfile.status === 'suspended') {
      return { satisfied: false, suggestedRedirect: routes.suspended }
    }
    return { satisfied: true }
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

  if (!verification) {
    return { satisfied: false, suggestedRedirect: routes.signup }
  }

  if (verification.status === 'rejected') {
    return { satisfied: false, suggestedRedirect: routes.rejected }
  }

  if (verification.status === 'approved') {
    return { satisfied: false, suggestedRedirect: routes.createProfile }
  }

  if (
    (PENDING_VERIFICATION_STATUSES as readonly string[]).includes(verification.status)
  ) {
    return { satisfied: false, suggestedRedirect: routes.pending }
  }

  return { satisfied: false, suggestedRedirect: routes.signup }
}
