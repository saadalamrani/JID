import type { SysDashboardMetrics } from '@/lib/governance/schemas'

export type PendingVerificationPreview = {
  id: string
  company_name: string
  claimant_name: string
  status: string
  created_at: string
  /** Proxy SLA deadline — verification_requests has no sla_due_at (reconciled Day 1). */
  sla_due_at: string
}

export type RecentAuditActivity = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  created_at: string
  actor_name: string | null
}

export type SystemHealthSnapshot = {
  cron_job_name: string
  cron_schedule: string
  cron_status: 'healthy' | 'stale' | 'unknown'
  last_mv_refresh: string | null
  db_latency_ms: number | null
  connection_pool: 'healthy' | 'degraded' | 'unknown'
  error_events_last_hour: number
  maintenance_mode: boolean
  maintenance_message: string | null
}

export type SysDashboardData = {
  metrics: SysDashboardMetrics
  pendingVerifications: PendingVerificationPreview[]
  activity: RecentAuditActivity[]
  health: SystemHealthSnapshot
}
