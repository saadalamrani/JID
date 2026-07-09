import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import type {
  StaffEntitiesListFilters,
  StaffEntitiesListResult,
  StaffEntityDetail,
  StaffEntityListRow,
  StaffEntityResponseStats,
  StaffEntitySlaEvent,
  StaffRegionOption,
  StaffSectorOption,
} from '@/types/staff-entities'
import { STAFF_ENTITIES_PAGE_SIZE } from '@/types/staff-entities'

type RegionJoin = { name_en: string; name_ar: string | null }

type CompanyRow = {
  id: string
  name: string
  name_ar: string | null
  entity_type: string
  ownership_type: string | null
  created_at: string
  updated_at: string
  region_id: string | null
  regions: RegionJoin | RegionJoin[] | null
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

/** Section 9 — approved companies + universities only. */
export async function fetchStaffEntitiesList(
  filters: StaffEntitiesListFilters = {},
): Promise<StaffEntitiesListResult> {
  await requireStaffShellAccess()
  const supabase = await createClient()
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = STAFF_ENTITIES_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('companies')
    .select(
      'id, name, name_ar, entity_type, ownership_type, created_at, updated_at, region_id, regions(name_en, name_ar)',
      { count: 'exact' },
    )
    .eq('entity_state', 'approved')
    .in('entity_type', ['company', 'university'])
    .order('created_at', { ascending: false })

  const q = filters.q?.trim()
  if (q) {
    query = query.or(`name.ilike.%${q.replace(/[%_\\]/g, '\\$&')}%,name_ar.ilike.%${q.replace(/[%_\\]/g, '\\$&')}%`)
  }

  const ownership = filters.ownership ?? 'all'
  if (ownership !== 'all') {
    query = query.eq('ownership_type', ownership)
  }

  if (filters.regionId) {
    query = query.eq('region_id', filters.regionId)
  }

  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  const rows: StaffEntityListRow[] = ((data ?? []) as CompanyRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    name_ar: row.name_ar,
    entity_type: row.entity_type,
    ownership_type: row.ownership_type,
    region_name: unwrapRelation(row.regions)?.name_en ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))

  const total = count ?? 0
  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function fetchStaffEntityDetail(entityId: string): Promise<StaffEntityDetail | null> {
  await requireStaffShellAccess()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('companies')
    .select(
      `
      *,
      sectors(name_en, name_ar),
      regions(name_en, name_ar)
    `,
    )
    .eq('id', entityId)
    .eq('entity_state', 'approved')
    .in('entity_type', ['company', 'university'])
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const sectors = unwrapRelation(
    data.sectors as RegionJoin | RegionJoin[] | null,
  )
  const regions = unwrapRelation(
    data.regions as RegionJoin | RegionJoin[] | null,
  )

  let claimant_name: string | null = null
  if (data.claimed_by) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.claimed_by)
      .maybeSingle()
    claimant_name = profile?.full_name ?? null
  }

  return {
    id: data.id,
    name: data.name,
    name_ar: data.name_ar,
    entity_type: data.entity_type,
    entity_state: data.entity_state,
    ownership_type: data.ownership_type,
    sector_id: data.sector_id,
    sector_name: sectors?.name_en ?? null,
    region_id: data.region_id,
    region_name: regions?.name_en ?? null,
    description_en: data.description_en,
    description_ar: data.description_ar,
    logo_url: data.logo_url,
    website_url: data.website_url,
    response_rate_pct: data.response_rate_pct,
    avg_response_days: data.avg_response_days,
    total_jobs_posted_12mo: data.total_jobs_posted_12mo ?? 0,
    is_verified: data.is_verified,
    claimed_by: data.claimed_by,
    claimant_name,
    city: data.city,
    domains: data.domains ?? [],
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

/** v_company_response_stats is not in this repo — fall back to companies columns. */
export async function fetchStaffEntityResponseStats(
  entityId: string,
): Promise<StaffEntityResponseStats | null> {
  const entity = await fetchStaffEntityDetail(entityId)
  if (!entity) return null

  const supabase = await createClient()
  const { error } = await supabase.from('companies').select('id').limit(0)
  const viewAvailable = false

  if (error) throw new Error(error.message)

  return {
    source: viewAvailable ? 'view' : 'company_columns',
    response_rate_pct: entity.response_rate_pct,
    avg_response_days: entity.avg_response_days,
    total_jobs_posted_12mo: entity.total_jobs_posted_12mo,
    viewAvailable,
  }
}

export async function fetchStaffEntitySlaHistory(entityId: string): Promise<StaffEntitySlaEvent[]> {
  await requireStaffShellAccess()
  const supabase = await createClient()

  const { data: jobs } = await supabase.from('jobs').select('id').eq('company_id', entityId)
  const jobIds = (jobs ?? []).map((row) => row.id)

  const events: StaffEntitySlaEvent[] = []

  if (jobIds.length > 0) {
    const { data: expiredApps } = await supabase
      .from('applications')
      .select('id, status, submitted_at, expires_at, updated_at, job_id')
      .in('job_id', jobIds)
      .eq('status', 'expired')
      .order('updated_at', { ascending: false })
      .limit(20)

    for (const app of expiredApps ?? []) {
      events.push({
        id: app.id,
        kind: 'application_expired',
        summary: `Application expired (job ${app.job_id.slice(0, 8)}…)`,
        occurred_at: app.updated_at ?? app.expires_at ?? app.submitted_at ?? new Date().toISOString(),
        status: app.status,
      })
    }
  }

  const { data: auditRows } = await supabase
    .from('audit_logs')
    .select('id, action, created_at, metadata')
    .eq('entity_id', entityId)
    .or('action.ilike.%sla%,action.ilike.%application%,action.ilike.%expired%')
    .order('created_at', { ascending: false })
    .limit(15)

  for (const row of auditRows ?? []) {
    events.push({
      id: row.id,
      kind: 'audit',
      summary: row.action,
      occurred_at: row.created_at,
      status: null,
    })
  }

  return events.sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  )
}

export async function fetchStaffRegionOptions(): Promise<StaffRegionOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('regions')
    .select('id, name_en, name_ar')
    .order('name_en', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as StaffRegionOption[]
}

export async function fetchStaffSectorOptions(): Promise<StaffSectorOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sectors')
    .select('id, name_en, name_ar')
    .order('name_en', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as StaffSectorOption[]
}
