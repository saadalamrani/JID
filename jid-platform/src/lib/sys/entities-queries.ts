import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type {
  SysEntitiesListFilters,
  SysEntitiesListResult,
  SysEntityVerificationRow,
  SysEntityDetail,
  SysEntityListRow,
} from '@/types/sys-entities'
import { SYS_ENTITIES_PAGE_SIZE } from '@/types/sys-entities'

export async function fetchSysEntitiesList(
  filters: SysEntitiesListFilters = {},
): Promise<SysEntitiesListResult> {
  const supabase = await createClient()
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = SYS_ENTITIES_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('companies')
    .select(
      'id, name, name_ar, entity_type, entity_state, is_verified, claimed_by, created_at, updated_at',
      { count: 'exact' },
    )
    .order('updated_at', { ascending: false })

  const q = filters.q?.trim()
  if (q) {
    query = query.or(`name.ilike.%${q}%,name_ar.ilike.%${q}%`)
  }

  const entityType = filters.entityType ?? 'all'
  if (entityType === 'company') query = query.eq('entity_type', 'business')
  if (entityType === 'university') query = query.eq('entity_type', 'university')

  const state = filters.state ?? 'all'
  if (state !== 'all') query = query.eq('entity_state', state)

  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  const total = count ?? 0
  return {
    rows: (data ?? []) as SysEntityListRow[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function fetchSysEntityDetail(entityId: string): Promise<SysEntityDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('companies').select('*').eq('id', entityId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null

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
    is_verified: data.is_verified,
    claimed_by: data.claimed_by,
    claim_requested_at: data.claim_requested_at,
    website_url: data.website_url,
    tagline_en: data.tagline_en,
    tagline_ar: data.tagline_ar,
    description_en: data.description_en,
    description_ar: data.description_ar,
    domains: data.domains ?? [],
    city: data.city,
    created_at: data.created_at,
    updated_at: data.updated_at,
    claimant_name,
  }
}

export async function fetchSysEntityVerificationHistory(
  entityId: string,
): Promise<SysEntityVerificationRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('verification_requests')
    .select(
      'id, applicant_user_id, status, verification_type, claimant_name, business_email, created_at, reviewed_at, reviewed_by, review_notes, rejection_reason',
    )
    .eq('directory_id', entityId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as SysEntityVerificationRow[]
}

/** @deprecated Use fetchSysEntityVerificationHistory */
export const fetchSysEntityClaimHistory = fetchSysEntityVerificationHistory

export async function fetchLatestPendingVerificationForEntity(entityId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('verification_requests')
    .select('id, applicant_user_id, status, verification_type, directory_id')
    .eq('directory_id', entityId)
    .in('status', ['pending', 'pending_review', 'under_review'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

/** @deprecated Use fetchLatestPendingVerificationForEntity */
export const fetchLatestPendingClaimForEntity = fetchLatestPendingVerificationForEntity
