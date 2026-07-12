'use server'

import { createBusinessProfile } from '@/lib/auth/verification'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { createClient } from '@/lib/supabase/server'
import type { BusinessProfileDraft } from '@/lib/validations/business-profile'

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function publishBusinessProfileAction(
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

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('business_profiles')
    .update({
      tagline_ar: emptyToNull(draft.tagline_ar ?? ''),
      about_ar: emptyToNull(draft.about_ar ?? ''),
      about_en: emptyToNull(draft.about_en ?? ''),
      founded_year: draft.founded_year ?? null,
      employee_count_range: draft.employee_count_range ?? null,
      cover_image_url: emptyToNull(draft.cover_image_url ?? ''),
      status: 'published',
      published_at: now,
    })
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

  const { error } = await supabase
    .from('business_profiles')
    .update({
      display_name_ar: draft.display_name_ar.trim(),
      display_name_en: emptyToNull(draft.display_name_en ?? ''),
      tagline_ar: emptyToNull(draft.tagline_ar ?? ''),
      about_ar: emptyToNull(draft.about_ar ?? ''),
      about_en: emptyToNull(draft.about_en ?? ''),
      founded_year: draft.founded_year ?? null,
      employee_count_range: draft.employee_count_range ?? null,
      cover_image_url: emptyToNull(draft.cover_image_url ?? ''),
    })
    .eq('id', profileId)
    .eq('owner_user_id', userId)

  if (error) {
    throw new Error(error.message)
  }
}
