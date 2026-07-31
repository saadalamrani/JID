import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { throwQueryError } from '@/lib/supabase/offline-error'
import type { Database } from '@/lib/supabase/types'
import type { SupabaseClient } from '@supabase/supabase-js'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

export type PublicProfileType = 'business' | 'university'

/** Public-safe columns shared across Profile types (never owner_user_id / moderation). */
export type PublicPublishedProfileFields = {
  id: string
  directory_id: string
  display_name_ar: string
  display_name_en: string | null
  about_ar: string | null
  about_en: string | null
  cover_image_url: string | null
  verified_domains: string[] | null
  published_at: string | null
  profile_type: PublicProfileType
}

export type PublicPublishedBusinessProfile = PublicPublishedProfileFields & {
  profile_type: 'business'
  tagline_ar: string | null
  founded_year: number | null
  employee_count_range: string | null
}

export type PublicPublishedUniversityProfile = PublicPublishedProfileFields & {
  profile_type: 'university'
  established_year: number | null
}

export type PublishedProfilePublicHref =
  | `/companies/${string}/profile`
  | `/universities/${string}/profile`

export type PublishedProfileLinkTarget = {
  profileType: PublicProfileType
  profileId: string
  directoryId: string
  slug: string
  href: PublishedProfilePublicHref
}

export type DirectoryPublishedProfileLookup =
  | { kind: 'none' }
  | { kind: 'link'; target: PublishedProfileLinkTarget }
  | { kind: 'ambiguous'; message: 'ambiguous_published_profiles' }

const BUSINESS_PUBLIC_SELECT =
  'id, directory_id, display_name_ar, display_name_en, tagline_ar, about_ar, about_en, founded_year, employee_count_range, cover_image_url, verified_domains, published_at, status' as const

const UNIVERSITY_PUBLIC_SELECT =
  'id, directory_id, display_name_ar, display_name_en, about_ar, about_en, established_year, cover_image_url, verified_domains, published_at, status' as const

type BusinessPublicRow = {
  id: string
  directory_id: string
  display_name_ar: string
  display_name_en: string | null
  tagline_ar: string | null
  about_ar: string | null
  about_en: string | null
  founded_year: number | null
  employee_count_range: string | null
  cover_image_url: string | null
  verified_domains: string[] | null
  published_at: string | null
  status: string
}

type UniversityPublicRow = {
  id: string
  directory_id: string
  display_name_ar: string
  display_name_en: string | null
  about_ar: string | null
  about_en: string | null
  established_year: number | null
  cover_image_url: string | null
  verified_domains: string[] | null
  published_at: string | null
  status: string
}

function mapBusiness(row: BusinessPublicRow): PublicPublishedBusinessProfile {
  return {
    id: row.id,
    directory_id: row.directory_id,
    display_name_ar: row.display_name_ar,
    display_name_en: row.display_name_en,
    tagline_ar: row.tagline_ar,
    about_ar: row.about_ar,
    about_en: row.about_en,
    founded_year: row.founded_year,
    employee_count_range: row.employee_count_range,
    cover_image_url: row.cover_image_url,
    verified_domains: row.verified_domains,
    published_at: row.published_at,
    profile_type: 'business',
  }
}

function mapUniversity(row: UniversityPublicRow): PublicPublishedUniversityProfile {
  return {
    id: row.id,
    directory_id: row.directory_id,
    display_name_ar: row.display_name_ar,
    display_name_en: row.display_name_en,
    about_ar: row.about_ar,
    about_en: row.about_en,
    established_year: row.established_year,
    cover_image_url: row.cover_image_url,
    verified_domains: row.verified_domains,
    published_at: row.published_at,
    profile_type: 'university',
  }
}

function publicHref(profileType: PublicProfileType, slug: string): PublishedProfilePublicHref {
  return profileType === 'university'
    ? `/universities/${slug}/profile`
    : `/companies/${slug}/profile`
}

/**
 * Server-side published Business Profile foundation (RLS is authoritative).
 * Draft/suspended/absent → null (not-found for public visitors).
 */
export async function fetchPublishedBusinessProfileById(
  profileId: string,
): Promise<PublicPublishedBusinessProfile | null> {
  const supabase = await createClient()
  const client = asUntyped(supabase)

  const { data, error } = await client
    .from('business_profiles')
    .select(BUSINESS_PUBLIC_SELECT)
    .eq('id', profileId)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throwQueryError(error)
  if (!data) return null

  const row = data as unknown as BusinessPublicRow
  if (row.status !== 'published') return null
  return mapBusiness(row)
}

/**
 * Server-side published University Profile foundation for `/universities/[slug]/profile`.
 */
export async function fetchPublishedUniversityProfileBySlug(
  slug: string,
): Promise<{
  profile: PublicPublishedUniversityProfile
  directory: { id: string; slug: string | null; logo_url: string | null }
} | null> {
  const supabase = await createClient()
  const client = asUntyped(supabase)

  const { data: directoryData, error: directoryError } = await client
    .from('companies')
    .select('id, slug, entity_type, is_active, logo_url')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (directoryError) throwQueryError(directoryError)
  if (!directoryData) return null

  const directory = directoryData as unknown as {
    id: string
    slug: string | null
    entity_type: string
    is_active: boolean
    logo_url: string | null
  }

  if (directory.entity_type !== 'university') return null

  const { data: profileData, error: profileError } = await client
    .from('university_profiles')
    .select(UNIVERSITY_PUBLIC_SELECT)
    .eq('directory_id', directory.id)
    .eq('status', 'published')
    .maybeSingle()

  if (profileError) throwQueryError(profileError)
  if (!profileData) return null

  const row = profileData as unknown as UniversityPublicRow
  if (row.status !== 'published') return null

  return {
    profile: mapUniversity(row),
    directory: { id: directory.id, slug: directory.slug, logo_url: directory.logo_url },
  }
}

/**
 * Directory-detail published Profile link foundation.
 * Never treats the Directory record as the Profile; draft/suspended → none.
 */
export async function lookupPublishedProfileLinkByDirectoryId(
  directoryId: string,
): Promise<DirectoryPublishedProfileLookup> {
  const supabase = await createClient()
  const client = asUntyped(supabase)

  const { data: directoryData, error: directoryError } = await client
    .from('companies')
    .select('id, slug, entity_type, is_active')
    .eq('id', directoryId)
    .eq('is_active', true)
    .maybeSingle()

  if (directoryError) throwQueryError(directoryError)
  if (!directoryData) return { kind: 'none' }

  const directory = directoryData as unknown as {
    id: string
    slug: string | null
    entity_type: string
  }

  if (!directory.slug) return { kind: 'none' }

  const profileType: PublicProfileType =
    directory.entity_type === 'university' ? 'university' : 'business'
  const table = profileType === 'university' ? 'university_profiles' : 'business_profiles'

  const { data: profiles, error: profileError } = await client
    .from(table)
    .select('id, status, directory_id')
    .eq('directory_id', directory.id)
    .eq('status', 'published')

  if (profileError) throwQueryError(profileError)

  const rows = (profiles ?? []) as unknown as Array<{
    id: string
    status: string
    directory_id: string
  }>
  const published = rows.filter((row) => row.status === 'published')

  if (published.length === 0) return { kind: 'none' }
  if (published.length > 1) {
    console.error('ambiguous_published_profiles', {
      directoryId: directory.id,
      profileType,
      count: published.length,
    })
    return { kind: 'ambiguous', message: 'ambiguous_published_profiles' }
  }

  const profile = published[0]
  if (!profile) return { kind: 'none' }

  return {
    kind: 'link',
    target: {
      profileType,
      profileId: profile.id,
      directoryId: directory.id,
      slug: directory.slug,
      href: publicHref(profileType, directory.slug),
    },
  }
}

/** Column allow-list used by public foundation queries (for contract tests). */
export const PUBLIC_PROFILE_SAFE_COLUMNS = {
  shared: [
    'id',
    'directory_id',
    'display_name_ar',
    'display_name_en',
    'about_ar',
    'about_en',
    'cover_image_url',
    'verified_domains',
    'published_at',
  ],
  businessOnly: ['tagline_ar', 'founded_year', 'employee_count_range'],
  universityOnly: ['established_year'],
  forbidden: ['owner_user_id', 'verified_badge'],
} as const
