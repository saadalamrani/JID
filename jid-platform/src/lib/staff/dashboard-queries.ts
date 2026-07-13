import 'server-only'

import type { AuditLogRow } from '@/lib/auth/audit-logs'
import { createClient } from '@/lib/supabase/server'
import { PENDING_CLAIM_STATUSES } from '@/lib/staff/claims'
import type { StaffPersonalMetrics, StaffDashboardClaimRow } from '@/lib/staff/types'

const EMPTY_METRICS: StaffPersonalMetrics = {
  staff_user_id: '',
  total_actions: 0,
  actions_today: 0,
  claims_reviewed: 0,
  claims_reviewed_today: 0,
  claims_assigned_open: 0,
  claims_approved_today: 0,
  claims_rejected_today: 0,
  avg_review_hours_7d: 0,
  flags_resolved: 0,
  flags_resolved_today: 0,
}

export async function fetchStaffPersonalMetrics(userId: string): Promise<StaffPersonalMetrics> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_staff_personal_metrics')

  if (error || !data?.length) {
    return { ...EMPTY_METRICS, staff_user_id: userId }
  }

  const row = data[0]!
  return {
    staff_user_id: row.staff_user_id ?? userId,
    total_actions: Number(row.total_actions ?? 0),
    actions_today: Number(row.actions_today ?? 0),
    claims_reviewed: Number(row.claims_reviewed ?? 0),
    claims_reviewed_today: Number(row.claims_reviewed_today ?? 0),
    claims_assigned_open: Number(row.claims_assigned_open ?? 0),
    claims_approved_today: Number(row.claims_approved_today ?? 0),
    claims_rejected_today: Number(row.claims_rejected_today ?? 0),
    avg_review_hours_7d: Number(row.avg_review_hours_7d ?? 0),
    flags_resolved: Number(row.flags_resolved ?? 0),
    flags_resolved_today: Number(row.flags_resolved_today ?? 0),
  }
}

export async function fetchAssignedClaimsForStaff(
  userId: string,
  limit = 10,
): Promise<StaffDashboardClaimRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('verification_requests')
    .select('id, company_name, claimant_name, status, sla_due_at, created_at, verification_type')
    .eq('assigned_staff_id', userId)
    .in('status', [...PENDING_CLAIM_STATUSES])
    .order('sla_due_at', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    company_name: row.company_name,
    claimant_name: row.claimant_name,
    status: row.status,
    sla_due_at: row.sla_due_at,
    created_at: row.created_at,
    verification_type: row.verification_type,
  }))
}

export async function fetchUnassignedClaims(limit = 5): Promise<StaffDashboardClaimRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('verification_requests')
    .select('id, company_name, claimant_name, status, sla_due_at, created_at, verification_type')
    .is('assigned_staff_id', null)
    .in('status', [...PENDING_CLAIM_STATUSES])
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    company_name: row.company_name,
    claimant_name: row.claimant_name,
    status: row.status,
    sla_due_at: row.sla_due_at,
    created_at: row.created_at,
    verification_type: row.verification_type,
  }))
}

export async function fetchStaffRecentActions(
  userId: string,
  limit = 15,
): Promise<AuditLogRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, entity_id, actor_id, metadata, created_at')
    .eq('actor_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as AuditLogRow[]
}

export async function fetchOpenFlagsCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('content_flags')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'under_review'])

  if (error) throw new Error(error.message)
  return count ?? 0
}
