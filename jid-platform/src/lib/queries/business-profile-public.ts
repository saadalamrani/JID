import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { throwQueryError } from '@/lib/supabase/offline-error'
import type {
  BusinessProfileData,
  DirectoryReferenceData,
} from '@/types/business-profile-public'
import { parseBusinessProfileGallery } from '@/types/business-profile-public'
import type { CatalogRegionRef, CatalogSectorRef, OwnershipType } from '@/types/catalog'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

type SectorRow = { slug: string; name_en: string; name_ar: string | null } | null
type RegionRow = { slug: string; name_en: string; name_ar: string | null } | null

function normalizeEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

function mapSectorRef(row: SectorRow): CatalogSectorRef | null {
  if (!row?.slug) return null
  return { slug: row.slug, name_en: row.name_en, name_ar: row.name_ar }
}

function mapRegionRef(row: RegionRow): CatalogRegionRef | null {
  if (!row?.slug) return null
  return { slug: row.slug, name_en: row.name_en, name_ar: row.name_ar }
}

type DirectoryRow = {
  id: string
  slug: string | null
  name: string
  name_ar: string | null
  logo_url: string | null
  ownership_type: OwnershipType | null
  sector: SectorRow | SectorRow[]
  region: RegionRow | RegionRow[]
}

type BusinessProfileRow = {
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
  gallery: unknown
  verified_badge: boolean
  status: string
}

function mapDirectory(row: DirectoryRow): DirectoryReferenceData {
  return {
    id: row.id,
    slug: row.slug,
    name_en: row.name,
    name_ar: row.name_ar,
    logo_url: row.logo_url,
    ownership_type: row.ownership_type,
    sector: mapSectorRef(normalizeEmbed(row.sector)),
    region: mapRegionRef(normalizeEmbed(row.region)),
  }
}

function mapProfile(row: BusinessProfileRow): BusinessProfileData {
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
    gallery: parseBusinessProfileGallery(row.gallery),
    verified_badge: row.verified_badge,
  }
}

const DIRECTORY_BY_SLUG_SELECT = `
  id,
  slug,
  name,
  name_ar,
  logo_url,
  ownership_type,
  sector:sectors!sector_id(slug, name_en, name_ar),
  region:regions!region_id(slug, name_en, name_ar)
` as const

export type PublishedBusinessProfilePageData = {
  profile: BusinessProfileData
  directory: DirectoryReferenceData
}

/**
 * Resolve companies.slug → directory row → published business_profiles (P-103 public read).
 */
export async function fetchPublishedBusinessProfileBySlug(
  slug: string,
): Promise<PublishedBusinessProfilePageData | null> {
  const supabase = await createClient()
  const client = asUntyped(supabase)

  const { data: directoryData, error: directoryError } = await client
    .from('companies')
    .select(DIRECTORY_BY_SLUG_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (directoryError) throwQueryError(directoryError)
  if (!directoryData) return null

  const directory = mapDirectory(directoryData as unknown as DirectoryRow)

  const { data: profileData, error: profileError } = await client
    .from('business_profiles')
    .select(
      'id, directory_id, display_name_ar, display_name_en, tagline_ar, about_ar, about_en, founded_year, employee_count_range, cover_image_url, gallery, verified_badge, status',
    )
    .eq('directory_id', directory.id)
    .eq('status', 'published')
    .maybeSingle()

  if (profileError) throwQueryError(profileError)
  if (!profileData) return null

  const profileRow = profileData as unknown as BusinessProfileRow
  if (profileRow.status !== 'published') return null

  return {
    profile: mapProfile(profileRow),
    directory,
  }
}
