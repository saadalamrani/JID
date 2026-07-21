import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { CatalogLookupOption, Company } from '@/types/catalog'

type Client = SupabaseClient<Database>

const DIRECTORY_SELECT = `
  id,
  slug,
  name,
  name_ar,
  entity_type,
  entity_state,
  is_active,
  is_verified,
  city,
  logo_url,
  cover_url,
  ownership_type,
  career_portal_url,
  website_url,
  linkedin_url,
  twitter_url,
  link_status,
  last_audit_at,
  broken_since,
  manual_order,
  sector_id,
  region_id,
  tagline_en,
  tagline_ar,
  founded_year,
  employee_count_range,
  description_ar,
  sector:sectors!sector_id(slug, name_en, name_ar),
  region:regions!region_id(slug, name_en, name_ar)
`

export async function fetchOrganizationDirectoryReference(
  client: Client,
  directoryId: string,
): Promise<Company | null> {
  const { data, error } = await client
    .from('companies')
    .select(DIRECTORY_SELECT)
    .eq('id', directoryId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const row = data as Record<string, unknown>
  const nameEn = typeof row.name === 'string' ? row.name : ''

  return {
    ...(row as Omit<
      Company,
      | 'name_en'
      | 'sector'
      | 'region'
      | 'hasPublishedProfile'
      | 'profile_id'
      | 'profile_display_name_ar'
      | 'profile_tagline_ar'
      | 'profile_about_ar'
    >),
    name_en: nameEn,
    sector: (row.sector as Company['sector']) ?? null,
    region: (row.region as Company['region']) ?? null,
    ownership_type: (row.ownership_type as Company['ownership_type']) ?? null,
    hasPublishedProfile: false,
    profile_id: null,
    profile_display_name_ar: null,
    profile_tagline_ar: null,
    profile_about_ar: null,
  }
}

export async function fetchDirectoryCorrectionLookups(
  client: Client,
): Promise<{ sectors: CatalogLookupOption[]; regions: CatalogLookupOption[] }> {
  const [{ data: sectors, error: sectorsError }, { data: regions, error: regionsError }] =
    await Promise.all([
      client.from('sectors').select('id, slug, name_en, name_ar').order('name_en'),
      client.from('regions').select('id, slug, name_en, name_ar').order('name_en'),
    ])

  if (sectorsError) throw new Error(sectorsError.message)
  if (regionsError) throw new Error(regionsError.message)

  return {
    sectors: (sectors ?? []) as CatalogLookupOption[],
    regions: (regions ?? []) as CatalogLookupOption[],
  }
}
