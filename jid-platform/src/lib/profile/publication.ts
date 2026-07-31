import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

export type OrganizationProfileType = 'business' | 'university'

export type PublicationRpcResult = {
  id: string
  status: 'published' | 'draft'
  published_at: string | null
}

function parsePublicationResult(data: Json | null): PublicationRpcResult {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('invalid_publication_result')
  }
  const record = data as Record<string, Json | undefined>
  const id = typeof record.id === 'string' ? record.id : null
  const status = record.status === 'published' || record.status === 'draft' ? record.status : null
  const publishedAt =
    record.published_at === null
      ? null
      : typeof record.published_at === 'string'
        ? record.published_at
        : null

  if (!id || !status) {
    throw new Error('invalid_publication_result')
  }

  return { id, status, published_at: publishedAt }
}

export async function publishBusinessProfile(
  client: Client,
  profileId: string,
): Promise<PublicationRpcResult> {
  const { data, error } = await client.rpc('publish_business_profile', {
    p_profile_id: profileId,
  })
  if (error) throw new Error(error.message)
  return parsePublicationResult(data)
}

export async function unpublishBusinessProfile(
  client: Client,
  profileId: string,
): Promise<PublicationRpcResult> {
  const { data, error } = await client.rpc('unpublish_business_profile', {
    p_profile_id: profileId,
  })
  if (error) throw new Error(error.message)
  return parsePublicationResult(data)
}

export async function publishUniversityProfile(
  client: Client,
  profileId: string,
): Promise<PublicationRpcResult> {
  const { data, error } = await client.rpc('publish_university_profile', {
    p_profile_id: profileId,
  })
  if (error) throw new Error(error.message)
  return parsePublicationResult(data)
}

export async function unpublishUniversityProfile(
  client: Client,
  profileId: string,
): Promise<PublicationRpcResult> {
  const { data, error } = await client.rpc('unpublish_university_profile', {
    p_profile_id: profileId,
  })
  if (error) throw new Error(error.message)
  return parsePublicationResult(data)
}

export async function publishOwnedProfile(
  client: Client,
  profileType: OrganizationProfileType,
  profileId: string,
): Promise<PublicationRpcResult> {
  return profileType === 'business'
    ? publishBusinessProfile(client, profileId)
    : publishUniversityProfile(client, profileId)
}

export async function unpublishOwnedProfile(
  client: Client,
  profileType: OrganizationProfileType,
  profileId: string,
): Promise<PublicationRpcResult> {
  return profileType === 'business'
    ? unpublishBusinessProfile(client, profileId)
    : unpublishUniversityProfile(client, profileId)
}

/** Map RPC exception text to stable action error codes for i18n. */
export type PublicationErrorCode =
  | 'unauthenticated'
  | 'invalid_input'
  | 'profile_not_found'
  | 'not_profile_owner'
  | 'profile_suspended'
  | 'profile_already_published'
  | 'profile_not_published'
  | 'profile_not_draft'
  | 'missing_display_name_ar'
  | 'missing_about_ar'
  | 'missing_display_name_ar_and_about_ar'
  | 'unknown'

export function mapPublicationError(message: string): PublicationErrorCode {
  const text = message.trim()

  if (text === 'Authentication required') return 'unauthenticated'
  if (text === 'profile_not_found') return 'profile_not_found'
  if (text === 'not_profile_owner') return 'not_profile_owner'
  if (text === 'profile_suspended') return 'profile_suspended'
  if (text === 'profile_already_published') return 'profile_already_published'
  if (text === 'profile_not_published') return 'profile_not_published'
  if (text === 'profile_not_draft') return 'profile_not_draft'

  const missingMatch = text.match(/^missing_required_fields:(.+)$/)
  if (missingMatch?.[1]) {
    const fields = missingMatch[1]
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    const hasName = fields.includes('display_name_ar')
    const hasAbout = fields.includes('about_ar')
    if (hasName && hasAbout) return 'missing_display_name_ar_and_about_ar'
    if (hasName) return 'missing_display_name_ar'
    if (hasAbout) return 'missing_about_ar'
  }

  return 'unknown'
}
