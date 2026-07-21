'use server'

import { buildUniversityProfileContentPatch } from '@/lib/auth/profile-creation-content'
import { createUniversityProfile } from '@/lib/auth/verification'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { updateOwnerUniversityProfile } from '@/lib/profile/organization-profile-update'
import { createClient } from '@/lib/supabase/server'
import type { UniversityProfileDraft } from '@/lib/validations/university-profile'

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** Layer 2 → Layer 3: RPC creates draft profile; owner may enrich content fields only. */
export async function createUniversityProfileAction(
  verificationId: string,
  draft: UniversityProfileDraft,
): Promise<{ profileId: string }> {
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()

  const profileId = await createUniversityProfile(supabase, {
    verificationId,
    displayNameAr: draft.display_name_ar,
    displayNameEn: emptyToNull(draft.display_name_en ?? ''),
  })

  const { error } = await supabase
    .from('university_profiles')
    .update(buildUniversityProfileContentPatch(draft))
    .eq('id', profileId)
    .eq('owner_user_id', userId)

  if (error) {
    throw new Error(error.message)
  }

  return { profileId }
}

export async function updateOwnerUniversityProfileAction(
  profileId: string,
  draft: UniversityProfileDraft,
): Promise<void> {
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()

  const result = await updateOwnerUniversityProfile(supabase, userId, profileId, draft)
  if (!result.ok) {
    throw new Error(result.message ?? 'Could not save profile')
  }
}
