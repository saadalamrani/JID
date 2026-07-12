import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import type { OwnershipType } from '@/types/catalog'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: Awaited<ReturnType<typeof createClient>>): UntypedClient {
  return client as unknown as UntypedClient
}

export type StaffDirectoryRow = {
  id: string
  slug: string | null
  name: string
  name_ar: string | null
  entity_type: string
  ownership_type: OwnershipType | null
  sector_id: string | null
  region_id: string | null
  sector_name: string | null
  region_name: string | null
  domains: string[]
  career_portal_url: string | null
  website_url: string | null
  logo_url: string | null
  is_active: boolean
  updated_at: string
}

export type StaffDirectoryFilters = {
  q?: string
  sectorId?: string
  regionId?: string
  ownership?: OwnershipType | 'all'
  active?: 'all' | 'active' | 'inactive'
}

export type StaffDirectoryListResult = {
  rows: StaffDirectoryRow[]
  total: number
}

type UntypedCompanyRow = {
  id: string
  slug: string | null
  name: string
  name_ar: string | null
  entity_type: string
  ownership_type: OwnershipType | null
  sector_id: string | null
  region_id: string | null
  domains: string[] | null
  career_portal_url: string | null
  website_url: string | null
  logo_url: string | null
  is_active: boolean
  updated_at: string
  sector: { name_en: string } | null
  region: { name_en: string } | null
}

function mapRow(row: UntypedCompanyRow): StaffDirectoryRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    name_ar: row.name_ar,
    entity_type: row.entity_type,
    ownership_type: row.ownership_type,
    sector_id: row.sector_id,
    region_id: row.region_id,
    sector_name: row.sector?.name_en ?? null,
    region_name: row.region?.name_en ?? null,
    domains: row.domains ?? [],
    career_portal_url: row.career_portal_url,
    website_url: row.website_url,
    logo_url: row.logo_url,
    is_active: row.is_active,
    updated_at: row.updated_at,
  }
}

const DIRECTORY_LIST_SELECT = `
  id, slug, name, name_ar, entity_type, ownership_type,
  sector_id, region_id, domains, career_portal_url, website_url, logo_url,
  is_active, updated_at,
  sector:sectors!sector_id(name_en),
  region:regions!region_id(name_en)
`

export async function fetchStaffDirectoryList(
  filters: StaffDirectoryFilters = {},
  limit = 50,
  offset = 0,
): Promise<StaffDirectoryListResult> {
  await requireStaffShellAccess()
  const supabase = asUntyped(await createClient())

  let query = supabase
    .from('companies')
    .select(DIRECTORY_LIST_SELECT, { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const q = filters.q?.trim()
  if (q) {
    const escaped = q.replace(/[%_\\]/g, '\\$&')
    query = query.or(`name.ilike.%${escaped}%,name_ar.ilike.%${escaped}%,slug.ilike.%${escaped}%`)
  }

  if (filters.sectorId) query = query.eq('sector_id', filters.sectorId)
  if (filters.regionId) query = query.eq('region_id', filters.regionId)
  if (filters.ownership && filters.ownership !== 'all') {
    query = query.eq('ownership_type', filters.ownership)
  }
  if (filters.active === 'active') query = query.eq('is_active', true)
  if (filters.active === 'inactive') query = query.eq('is_active', false)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    rows: ((data ?? []) as unknown as UntypedCompanyRow[]).map(mapRow),
    total: count ?? 0,
  }
}

export async function fetchStaffDirectoryById(id: string): Promise<StaffDirectoryRow | null> {
  await requireStaffShellAccess()
  const supabase = asUntyped(await createClient())

  const { data, error } = await supabase
    .from('companies')
    .select(DIRECTORY_LIST_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return mapRow(data as unknown as UntypedCompanyRow)
}

export type CorrectionSuggestionRow = {
  id: string
  directory_id: string
  directory_name: string
  field_name: string
  current_value: string | null
  suggested_value: string
  reason: string | null
  status: string
  created_at: string
}

export async function fetchPendingCorrectionSuggestions(
  limit = 100,
): Promise<CorrectionSuggestionRow[]> {
  await requireStaffShellAccess()
  const supabase = asUntyped(await createClient())

  const { data, error } = await supabase
    .from('directory_correction_suggestions')
    .select(
      'id, directory_id, field_name, current_value, suggested_value, reason, status, created_at',
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Array<{
    id: string
    directory_id: string
    field_name: string
    current_value: string | null
    suggested_value: string
    reason: string | null
    status: string
    created_at: string
  }>

  const directoryIds = Array.from(new Set(rows.map((row) => row.directory_id)))
  const nameById = new Map<string, string>()

  if (directoryIds.length > 0) {
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, name_ar')
      .in('id', directoryIds)

    for (const company of (companies ?? []) as Array<{
      id: string
      name: string
      name_ar: string | null
    }>) {
      nameById.set(company.id, company.name_ar ?? company.name)
    }
  }

  return rows.map((row) => ({
    id: row.id,
    directory_id: row.directory_id,
    directory_name: nameById.get(row.directory_id) ?? row.directory_id,
    field_name: row.field_name,
    current_value: row.current_value,
    suggested_value: row.suggested_value,
    reason: row.reason,
    status: row.status,
    created_at: row.created_at,
  }))
}

export type ModerationProfileRow = {
  id: string
  profileType: 'business' | 'university'
  displayName: string
  status: string
  ownerUserId: string
  ownerName: string | null
  directoryId: string
  directoryName: string
}

export async function fetchModerationProfiles(
  q?: string,
  limit = 50,
): Promise<ModerationProfileRow[]> {
  await requireStaffShellAccess()
  const supabase = asUntyped(await createClient())
  const typed = await createClient()

  const [businessResult, universityResult] = await Promise.all([
    supabase
      .from('business_profiles')
      .select('id, display_name_ar, status, owner_user_id, directory_id')
      .order('updated_at', { ascending: false })
      .limit(limit),
    supabase
      .from('university_profiles')
      .select('id, display_name_ar, status, owner_user_id, directory_id')
      .order('updated_at', { ascending: false })
      .limit(limit),
  ])

  if (businessResult.error) throw new Error(businessResult.error.message)
  if (universityResult.error) throw new Error(universityResult.error.message)

  type ProfileRow = {
    id: string
    display_name_ar: string
    status: string
    owner_user_id: string
    directory_id: string
  }

  const businessRows = (businessResult.data ?? []) as ProfileRow[]
  const universityRows = (universityResult.data ?? []) as ProfileRow[]

  const ownerIds = Array.from(
    new Set([...businessRows, ...universityRows].map((row) => row.owner_user_id)),
  )
  const directoryIds = Array.from(
    new Set([...businessRows, ...universityRows].map((row) => row.directory_id)),
  )

  const ownerNameById = new Map<string, string | null>()
  const directoryNameById = new Map<string, string>()

  if (ownerIds.length > 0) {
    const { data: owners } = await typed
      .from('profiles')
      .select('id, full_name')
      .in('id', ownerIds)
    for (const owner of owners ?? []) {
      ownerNameById.set(owner.id, owner.full_name)
    }
  }

  if (directoryIds.length > 0) {
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, name_ar')
      .in('id', directoryIds)
    for (const company of (companies ?? []) as Array<{
      id: string
      name: string
      name_ar: string | null
    }>) {
      directoryNameById.set(company.id, company.name_ar ?? company.name)
    }
  }

  const needle = q?.trim().toLowerCase()

  const merged: ModerationProfileRow[] = [
    ...businessRows.map((row) => ({
      id: row.id,
      profileType: 'business' as const,
      displayName: row.display_name_ar,
      status: row.status,
      ownerUserId: row.owner_user_id,
      ownerName: ownerNameById.get(row.owner_user_id) ?? null,
      directoryId: row.directory_id,
      directoryName: directoryNameById.get(row.directory_id) ?? row.directory_id,
    })),
    ...universityRows.map((row) => ({
      id: row.id,
      profileType: 'university' as const,
      displayName: row.display_name_ar,
      status: row.status,
      ownerUserId: row.owner_user_id,
      ownerName: ownerNameById.get(row.owner_user_id) ?? null,
      directoryId: row.directory_id,
      directoryName: directoryNameById.get(row.directory_id) ?? row.directory_id,
    })),
  ]

  if (!needle) return merged.slice(0, limit)

  return merged
    .filter(
      (row) =>
        row.displayName.toLowerCase().includes(needle) ||
        row.directoryName.toLowerCase().includes(needle) ||
        (row.ownerName?.toLowerCase().includes(needle) ?? false),
    )
    .slice(0, limit)
}
