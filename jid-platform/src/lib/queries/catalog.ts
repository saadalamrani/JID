import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { throwQueryError } from '@/lib/supabase/offline-error'
import type {
  CatalogCompaniesResult,
  CatalogFilters,
  CatalogLookupOption,
  CatalogRegionRef,
  CatalogSectorRef,
  Company,
  CompanyCardData,
  LinkStatus,
  OwnershipType,
  PublishedProfileProjection,
  SortOption,
} from '@/types/catalog'
import { DEFAULT_CATALOG_FILTERS } from '@/types/catalog'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

/** Explicit public list projection (Section 5.3) + published profile LEFT JOIN. */
const CATALOG_LIST_SELECT = `
  id,
  slug,
  name,
  name_ar,
  logo_url,
  ownership_type,
  career_portal_url,
  link_status,
  last_audit_at,
  manual_order,
  entity_type,
  sector:sectors!sector_id(slug, name_en, name_ar),
  region:regions!region_id(slug, name_en, name_ar),
  business_profiles(id, display_name_ar, tagline_ar, about_ar, status),
  university_profiles(id, display_name_ar, about_ar, status)
` as const

const CATALOG_DETAIL_SELECT = `
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
  tagline_en,
  tagline_ar,
  founded_year,
  employee_count_range,
  description_ar,
  sector_id,
  region_id,
  sector:sectors!sector_id(slug, name_en, name_ar),
  region:regions!region_id(slug, name_en, name_ar),
  business_profiles(id, display_name_ar, tagline_ar, about_ar, status),
  university_profiles(id, display_name_ar, about_ar, status)
` as const

type SectorRow = { slug: string; name_en: string; name_ar: string | null } | null
type RegionRow = { slug: string; name_en: string; name_ar: string | null } | null

type ProfileEmbedRow = {
  id: string
  display_name_ar: string
  tagline_ar?: string | null
  about_ar?: string | null
  status: string
}

type CatalogListRow = {
  id: string
  slug: string | null
  name: string
  name_ar: string | null
  logo_url: string | null
  ownership_type: OwnershipType | null
  career_portal_url: string | null
  link_status: LinkStatus
  last_audit_at: string | null
  manual_order: number
  entity_type: string
  sector: SectorRow
  region: RegionRow
  business_profiles: ProfileEmbedRow | ProfileEmbedRow[] | null
  university_profiles: ProfileEmbedRow | ProfileEmbedRow[] | null
}

export function resolvePublishedProfile(
  entityType: string,
  businessProfiles: ProfileEmbedRow | ProfileEmbedRow[] | null | undefined,
  universityProfiles: ProfileEmbedRow | ProfileEmbedRow[] | null | undefined,
): PublishedProfileProjection {
  const businessProfile = normalizeEmbed(businessProfiles)
  const universityProfile = normalizeEmbed(universityProfiles)
  const profile = entityType === 'university' ? universityProfile : businessProfile

  if (profile?.id && profile.status === 'published') {
    return {
      hasPublishedProfile: true,
      profile_id: profile.id,
      profile_display_name_ar: profile.display_name_ar,
      profile_tagline_ar: profile.tagline_ar ?? null,
      profile_about_ar: profile.about_ar ?? null,
    }
  }

  return {
    hasPublishedProfile: false,
    profile_id: null,
    profile_display_name_ar: null,
    profile_tagline_ar: null,
    profile_about_ar: null,
  }
}

function mapSectorRef(row: SectorRow): CatalogSectorRef | null {
  if (!row?.slug) return null
  return { slug: row.slug, name_en: row.name_en, name_ar: row.name_ar }
}

function mapRegionRef(row: RegionRow): CatalogRegionRef | null {
  if (!row?.slug) return null
  return { slug: row.slug, name_en: row.name_en, name_ar: row.name_ar }
}

function mapCompanyCard(row: CatalogListRow): CompanyCardData {
  const sector = normalizeEmbed(row.sector)
  const region = normalizeEmbed(row.region)
  const published = resolvePublishedProfile(
    row.entity_type,
    row.business_profiles,
    row.university_profiles,
  )

  return {
    id: row.id,
    slug: row.slug,
    name_en: row.name,
    name_ar: row.name_ar,
    sector: mapSectorRef(sector),
    region: mapRegionRef(region),
    logo_url: row.logo_url,
    ownership_type: row.ownership_type,
    career_portal_url: row.career_portal_url,
    link_status: row.link_status ?? 'pending',
    last_audit_at: row.last_audit_at,
    manual_order: row.manual_order ?? 0,
    hasPublishedProfile: published.hasPublishedProfile,
    profile_id: published.profile_id,
    profile_display_name_ar: published.profile_display_name_ar,
    profile_tagline_ar: published.profile_tagline_ar,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CatalogQuery = any

function applySort(query: CatalogQuery, sort: SortOption): CatalogQuery {
  switch (sort) {
    case 'alphabetical_en':
    case 'name_asc':
      return query.order('name', { ascending: true })
    case 'name_desc':
      return query.order('name', { ascending: false })
    case 'recent_audit':
      return query
        .order('last_audit_at', { ascending: false, nullsFirst: false })
        .order('name', { ascending: true })
    case 'manual_order':
    case 'featured':
    default:
      return query
        .order('manual_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true })
  }
}

function normalizeEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

async function resolveSectorIds(
  client: UntypedClient,
  slugs: string[],
): Promise<string[]> {
  const { data, error } = await client.from('sectors').select('id').in('slug', slugs)
  if (error) throwQueryError(error)
  return (data ?? []).map((row) => String((row as { id: string }).id))
}

async function resolveRegionIds(
  client: UntypedClient,
  slugs: string[],
): Promise<string[]> {
  const { data, error } = await client.from('regions').select('id').in('slug', slugs)
  if (error) throwQueryError(error)
  return (data ?? []).map((row) => String((row as { id: string }).id))
}

export async function fetchCompanies(
  filters: CatalogFilters = {},
): Promise<CatalogCompaniesResult> {
  const supabase = await createClient()
  const client = asUntyped(supabase)

  const page = filters.page ?? DEFAULT_CATALOG_FILTERS.page!
  const limit = filters.limit ?? DEFAULT_CATALOG_FILTERS.limit!
  const sort = filters.sort ?? DEFAULT_CATALOG_FILTERS.sort!
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = client
    .from('companies')
    .select(CATALOG_LIST_SELECT, { count: 'exact' })
    .eq('is_active', true)
    .eq('entity_type', 'business')

  if (filters.q?.trim()) {
    query = query.textSearch('search_vector', filters.q.trim(), {
      type: 'websearch',
      config: 'simple',
    })
  }

  if (filters.sectors?.length) {
    const sectorIds = await resolveSectorIds(client, filters.sectors)
    if (sectorIds.length === 0) {
      return { companies: [], count: 0, page, limit }
    }
    query = query.in('sector_id', sectorIds)
  }

  if (filters.regions?.length) {
    const regionIds = await resolveRegionIds(client, filters.regions)
    if (regionIds.length === 0) {
      return { companies: [], count: 0, page, limit }
    }
    query = query.in('region_id', regionIds)
  }

  if (filters.ownership?.length) {
    query = query.in('ownership_type', filters.ownership)
  }

  if (filters.linkStatus?.length) {
    query = query.in('link_status', filters.linkStatus)
  }

  query = applySort(query, sort)
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throwQueryError(error)
  }

  const companies = ((data ?? []) as unknown as CatalogListRow[]).map(mapCompanyCard)

  return {
    companies,
    count: count ?? companies.length,
    page,
    limit,
  }
}

function mapCompanyDetail(row: CatalogListRow & {
  entity_state: string
  is_active: boolean
  is_verified: boolean
  city: string | null
  cover_url: string | null
  website_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
  broken_since: string | null
  tagline_en: string | null
  tagline_ar: string | null
  founded_year: number | null
  employee_count_range: string | null
  description_ar: string | null
  sector_id: string | null
  region_id: string | null
}): Company {
  const sector = normalizeEmbed(row.sector)
  const region = normalizeEmbed(row.region)
  const published = resolvePublishedProfile(
    row.entity_type,
    row.business_profiles,
    row.university_profiles,
  )

  return {
    id: row.id,
    slug: row.slug,
    name_en: row.name,
    name_ar: row.name_ar,
    entity_type: row.entity_type,
    entity_state: row.entity_state,
    is_active: row.is_active,
    is_verified: row.is_verified,
    city: row.city,
    logo_url: row.logo_url,
    cover_url: row.cover_url,
    ownership_type: row.ownership_type,
    career_portal_url: row.career_portal_url,
    website_url: row.website_url,
    linkedin_url: row.linkedin_url,
    twitter_url: row.twitter_url,
    link_status: row.link_status ?? 'pending',
    last_audit_at: row.last_audit_at,
    broken_since: row.broken_since,
    manual_order: row.manual_order ?? 0,
    sector: mapSectorRef(sector),
    region: mapRegionRef(region),
    sector_id: row.sector_id,
    region_id: row.region_id,
    tagline_en: row.tagline_en,
    tagline_ar: row.tagline_ar,
    founded_year: row.founded_year,
    employee_count_range: row.employee_count_range,
    description_ar: row.description_ar,
    ...published,
  }
}

export async function fetchCompanyBySlug(slug: string): Promise<Company | null> {
  const supabase = await createClient()
  const client = asUntyped(supabase)

  const { data, error } = await client
    .from('companies')
    .select(CATALOG_DETAIL_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throwQueryError(error)
  if (!data) return null

  return mapCompanyDetail(data as unknown as CatalogListRow & {
    entity_state: string
    is_active: boolean
    is_verified: boolean
    city: string | null
    cover_url: string | null
    website_url: string | null
    linkedin_url: string | null
    twitter_url: string | null
    broken_since: string | null
    tagline_en: string | null
    tagline_ar: string | null
    founded_year: number | null
    employee_count_range: string | null
    description_ar: string | null
    sector_id: string | null
    region_id: string | null
  })
}

/** True when the session user owns a Layer-3 profile anchored to this directory row. */
export async function fetchViewerOwnsDirectory(directoryId: string): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const client = asUntyped(supabase)

  const { data: businessProfile } = await client
    .from('business_profiles')
    .select('id')
    .eq('directory_id', directoryId)
    .eq('owner_user_id', user.id)
    .maybeSingle()

  if (businessProfile) return true

  const { data: universityProfile } = await client
    .from('university_profiles')
    .select('id')
    .eq('directory_id', directoryId)
    .eq('owner_user_id', user.id)
    .maybeSingle()

  return Boolean(universityProfile)
}

export async function fetchCatalogSectorOptions(): Promise<CatalogLookupOption[]> {
  const supabase = await createClient()
  const client = asUntyped(supabase)
  const { data, error } = await client
    .from('sectors')
    .select('id, slug, name_en, name_ar')
    .order('display_order', { ascending: true })

  if (error) throwQueryError(error)
  return (data ?? []) as CatalogLookupOption[]
}

export async function fetchCatalogRegionOptions(): Promise<CatalogLookupOption[]> {
  const supabase = await createClient()
  const client = asUntyped(supabase)
  const { data, error } = await client
    .from('regions')
    .select('id, slug, name_en, name_ar')
    .order('name_ar', { ascending: true })

  if (error) throwQueryError(error)
  return (data ?? []) as CatalogLookupOption[]
}
