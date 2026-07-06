import 'server-only'

import { sysDashboardMetricsSchema, type SysDashboardMetrics } from '@/lib/governance/schemas'
import { DASHBOARD_ALERT_THRESHOLDS } from '@/lib/sys/dashboard-constants'
import { fetchMaintenanceMode } from '@/lib/sys/shell-context'
import { createClient } from '@/lib/supabase/server'
import type {
  PendingClaimPreview,
  RecentAuditActivity,
  SysDashboardData,
  SystemHealthSnapshot,
} from '@/types/sys-dashboard'

export type {
  PendingClaimPreview,
  RecentAuditActivity,
  SysDashboardData,
  SystemHealthSnapshot,
} from '@/types/sys-dashboard'

const PENDING_CLAIM_STATUSES = ['pending', 'pending_review', 'under_review'] as const
const SLA_HOURS = DASHBOARD_ALERT_THRESHOLDS.slaHours
const CRON_STALE_MINUTES = DASHBOARD_ALERT_THRESHOLDS.cronStaleMinutes
const DB_LATENCY_DEGRADED_MS = DASHBOARD_ALERT_THRESHOLDS.dbLatencyDegradedMs

function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString()
}

function cronStatusFromRefresh(refreshedAt: string | null): 'healthy' | 'stale' | 'unknown' {
  if (!refreshedAt) return 'unknown'
  const ageMinutes = (Date.now() - new Date(refreshedAt).getTime()) / 60_000
  return ageMinutes <= CRON_STALE_MINUTES ? 'healthy' : 'stale'
}

/** Section 6.1 — materialized view singleton row. */
export async function fetchDashboardMetrics(): Promise<SysDashboardMetrics> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mv_sys_dashboard_metrics')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      return sysDashboardMetricsSchema.parse({
        id: 1,
        refreshed_at: new Date().toISOString(),
        total_users: 0,
        suspended_users: 0,
        active_sessions_now: 0,
        pending_claims: 0,
        overdue_claims: 0,
        audit_events_24h: 0,
        pending_mentor_applications: 0,
        pending_staff_invites: 0,
      })
    }
    throw new Error(error.message)
  }
  if (!data) {
    if (process.env.NODE_ENV === 'development') {
      return sysDashboardMetricsSchema.parse({
        id: 1,
        refreshed_at: new Date().toISOString(),
        total_users: 0,
        suspended_users: 0,
        active_sessions_now: 0,
        pending_claims: 0,
        overdue_claims: 0,
        audit_events_24h: 0,
        pending_mentor_applications: 0,
        pending_staff_invites: 0,
      })
    }
    throw new Error('mv_sys_dashboard_metrics has no row — run refresh_sys_metrics()')
  }

  return sysDashboardMetricsSchema.parse({
    ...data,
    id: data.id ?? 1,
    total_users: Number(data.total_users ?? 0),
    suspended_users: Number(data.suspended_users ?? 0),
    active_sessions_now: Number(data.active_sessions_now ?? 0),
    pending_claims: Number(data.pending_claims ?? 0),
    overdue_claims: Number(data.overdue_claims ?? 0),
    audit_events_24h: Number(data.audit_events_24h ?? 0),
    pending_mentor_applications: Number(data.pending_mentor_applications ?? 0),
    pending_staff_invites: Number(data.pending_staff_invites ?? 0),
    refreshed_at: data.refreshed_at ?? new Date().toISOString(),
  })
}

/** Section 6.1 — top 5 pending claims ordered by earliest SLA proxy (created_at ASC). */
export async function fetchPendingClaimsPreview(): Promise<PendingClaimPreview[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('claim_requests')
    .select('id, company_name, claimant_name, status, created_at')
    .in('status', [...PENDING_CLAIM_STATUSES])
    .order('created_at', { ascending: true })
    .limit(5)

  if (error) {
    if (process.env.NODE_ENV === 'development') return []
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    company_name: row.company_name,
    claimant_name: row.claimant_name,
    status: row.status,
    created_at: row.created_at,
    sla_due_at: addHours(row.created_at, SLA_HOURS),
  }))
}

/** Section 6.1 — last 10 audit events with actor names. */
export async function fetchRecentAuditActivity(): Promise<RecentAuditActivity[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audit_logs')
    .select(
      'id, action, entity_type, entity_id, created_at, actor:profiles!audit_logs_actor_id_fkey(full_name)',
    )
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    if (process.env.NODE_ENV === 'development') return []
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => {
    const actor = row.actor as { full_name: string | null } | null
    return {
      id: row.id,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      created_at: row.created_at,
      actor_name: actor?.full_name ?? null,
    }
  })
}

async function countErrorAuditEventsLastHour(): Promise<number> {
  const supabase = await createClient()
  const since = new Date(Date.now() - 3_600_000).toISOString()
  const { count, error } = await supabase
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)
    .or('action.ilike.%error%,action.ilike.%failed%')

  if (error) return 0
  return count ?? 0
}

/** Section 6.1 — cron cadence, MV refresh timestamp, DB latency proxy. */
export async function fetchSystemHealth(): Promise<SystemHealthSnapshot> {
  const started = Date.now()
  const supabase = await createClient()

  const [{ error: pingError }, { data: mvRow }, maintenance, errorEventsLastHour] =
    await Promise.all([
      supabase.from('profiles').select('id').limit(1),
      supabase.from('mv_sys_dashboard_metrics').select('refreshed_at').eq('id', 1).maybeSingle(),
      fetchMaintenanceMode(),
      countErrorAuditEventsLastHour(),
    ])

  const dbLatencyMs = pingError ? null : Date.now() - started
  const metricsRefreshedAt = mvRow?.refreshed_at ?? null
  const cronStatus = cronStatusFromRefresh(metricsRefreshedAt)
  let connectionPool: SystemHealthSnapshot['connection_pool'] = 'unknown'
  if (dbLatencyMs !== null) {
    connectionPool = dbLatencyMs <= DB_LATENCY_DEGRADED_MS ? 'healthy' : 'degraded'
  }

  return {
    cron_job_name: 'refresh-sys-metrics',
    cron_schedule: '*/5 * * * *',
    cron_status: cronStatus,
    last_mv_refresh: metricsRefreshedAt,
    db_latency_ms: dbLatencyMs,
    connection_pool: connectionPool,
    error_events_last_hour: errorEventsLastHour,
    maintenance_mode: maintenance.enabled,
    maintenance_message: maintenance.message,
  }
}

/** Section 6.1 — parallel dashboard data loader (four queries). */
export async function fetchSysDashboardData(): Promise<SysDashboardData> {
  const [metrics, claims, activity, health] = await Promise.all([
    fetchDashboardMetrics(),
    fetchPendingClaimsPreview(),
    fetchRecentAuditActivity(),
    fetchSystemHealth(),
  ])

  return { metrics, claims, activity, health }
}
