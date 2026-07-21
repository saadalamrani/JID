'use server'

import { buildBusinessProfileContentPatch } from '@/lib/auth/profile-creation-content'
import { createBusinessProfile } from '@/lib/auth/verification'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { updateOwnerBusinessProfile } from '@/lib/profile/organization-profile-update'
import { createClient } from '@/lib/supabase/server'
import type { BusinessProfileDraft } from '@/lib/validations/business-profile'

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** Layer 2 → Layer 3: RPC creates draft profile; owner may enrich content fields only. */
export async function createBusinessProfileAction(
  verificationId: string,
  draft: BusinessProfileDraft,
): Promise<{ profileId: string }> {
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()

  const profileId = await createBusinessProfile(supabase, {
    verificationId,
    displayNameAr: draft.display_name_ar,
    displayNameEn: emptyToNull(draft.display_name_en ?? ''),
  })

  const { error } = await supabase
    .from('business_profiles')
    .update(buildBusinessProfileContentPatch(draft))
    .eq('id', profileId)
    .eq('owner_user_id', userId)

  if (error) {
    throw new Error(error.message)
  }

  return { profileId }
}

export async function updateOwnerBusinessProfileAction(
  profileId: string,
  draft: BusinessProfileDraft,
): Promise<void> {
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()

  const result = await updateOwnerBusinessProfile(supabase, userId, profileId, draft)
  if (!result.ok) {
    throw new Error(result.message ?? 'Could not save profile')
  }
}
