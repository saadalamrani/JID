import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import {
  buildBusinessProfileContentPatch,
  buildUniversityProfileContentPatch,
  FORBIDDEN_PROFILE_MODERATION_KEYS,
} from '@/lib/auth/profile-creation-content'
import type { BusinessProfileDraft } from '@/lib/validations/business-profile'
import type { UniversityProfileDraft } from '@/lib/validations/university-profile'

export type OrganizationProfileKind = 'business' | 'university'

type Client = SupabaseClient<Database>

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function buildOwnerBusinessUpdatePayload(draft: BusinessProfileDraft) {
  return {
    display_name_ar: draft.display_name_ar.trim(),
    display_name_en: emptyToNull(draft.display_name_en ?? ''),
    ...buildBusinessProfileContentPatch(draft),
  }
}

export function buildOwnerUniversityUpdatePayload(draft: UniversityProfileDraft) {
  return {
    display_name_ar: draft.display_name_ar.trim(),
    display_name_en: emptyToNull(draft.display_name_en ?? ''),
    ...buildUniversityProfileContentPatch(draft),
  }
}

export function assertNoModerationFields(patch: Record<string, unknown>): void {
  for (const key of FORBIDDEN_PROFILE_MODERATION_KEYS) {
    if (key in patch) {
      throw new Error(`forbidden_field:${key}`)
    }
  }
}

export type UpdateOwnerProfileResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'forbidden' | 'error'; message?: string }

export async function updateOwnerBusinessProfile(
  client: Client,
  userId: string,
  profileId: string,
  draft: BusinessProfileDraft,
): Promise<UpdateOwnerProfileResult> {
  const patch = buildOwnerBusinessUpdatePayload(draft)
  assertNoModerationFields(patch)

  const { data, error } = await client
    .from('business_profiles')
    .update(patch)
    .eq('id', profileId)
    .eq('owner_user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { ok: false, reason: 'error', message: error.message }
  }
  if (!data) {
    return { ok: false, reason: 'not_found' }
  }
  return { ok: true }
}

export async function updateOwnerUniversityProfile(
  client: Client,
  userId: string,
  profileId: string,
  draft: UniversityProfileDraft,
): Promise<UpdateOwnerProfileResult> {
  const patch = buildOwnerUniversityUpdatePayload(draft)
  assertNoModerationFields(patch)

  const { data, error } = await client
    .from('university_profiles')
    .update(patch)
    .eq('id', profileId)
    .eq('owner_user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) {
    return { ok: false, reason: 'error', message: error.message }
  }
  if (!data) {
    return { ok: false, reason: 'not_found' }
  }
  return { ok: true }
}

export async function readOwnerBusinessProfile(
  client: Client,
  userId: string,
  profileId: string,
) {
  const { data, error } = await client
    .from('business_profiles')
    .select('*')
    .eq('id', profileId)
    .eq('owner_user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function readOwnerUniversityProfile(
  client: Client,
  userId: string,
  profileId: string,
) {
  const { data, error } = await client
    .from('university_profiles')
    .select('*')
    .eq('id', profileId)
    .eq('owner_user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

/** Profile preview must use owned Profile fields, not Directory-authored values. */
export function businessPreviewUsesOwnedProfile(
  profile: { display_name_ar: string; about_ar: string | null },
  directory: { name_ar: string | null; description_ar: string | null },
): boolean {
  if (profile.display_name_ar.trim() !== (directory.name_ar ?? '').trim()) return true
  if (hasText(profile.about_ar) && profile.about_ar !== directory.description_ar) return true
  return hasText(profile.display_name_ar) || hasText(profile.about_ar)
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}
