import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { resolveAuditActionFilter } from '@/lib/sys/audit-catalog'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import type {
  StaffAuditEvent,
  StaffAuditFilters,
  StaffAuditPageResult,
} from '@/types/staff-audit'
import { STAFF_AUDIT_PAGE_SIZE } from '@/types/staff-audit'

type AuditRow = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  actor_id: string | null
  metadata: unknown
  old_data: unknown
  new_data: unknown
  created_at: string
}

function mapAuditRow(row: AuditRow): StaffAuditEvent {
  return {
    id: row.id,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    actor_id: row.actor_id,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    old_data: (row.old_data ?? null) as Record<string, unknown> | null,
    new_data: (row.new_data ?? null) as Record<string, unknown> | null,
    created_at: row.created_at,
  }
}

/**
 * Section 11 — personal audit timeline scoped to the signed-in staff actor only.
 * RLS (`audit_logs_select_staff_own`) + explicit `.eq('actor_id', actorId)` double-check.
 */
export async function fetchStaffPersonalAuditTimeline(
  filters: StaffAuditFilters = {},
): Promise<StaffAuditPageResult> {
  const staff = await requireStaffShellAccess()
  const supabase = await createClient()
  const pageSize = STAFF_AUDIT_PAGE_SIZE

  let query = supabase
    .from('audit_logs')
    .select(
      `
      id,
      action,
      entity_type,
      entity_id,
      actor_id,
      metadata,
      old_data,
      new_data,
      created_at
    `,
    )
    .eq('actor_id', staff.id)
    .order('created_at', { ascending: false })
    .limit(pageSize + 1)

  if (filters.before) {
    query = query.lt('created_at', filters.before)
  }

  if (filters.from) {
    query = query.gte('created_at', filters.from)
  }

  if (filters.to) {
    const toDate = new Date(filters.to)
    if (!Number.isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999)
      query = query.lte('created_at', toDate.toISOString())
    }
  }

  if (filters.actionType && filters.actionType !== 'all') {
    query = query.eq('action', resolveAuditActionFilter(filters.actionType))
  }

  if (filters.entityType) {
    query = query.eq('entity_type', filters.entityType)
  }

  if (filters.entityId) {
    query = query.eq('entity_id', filters.entityId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as AuditRow[]
  const hasMore = rows.length > pageSize
  const pageRows = hasMore ? rows.slice(0, pageSize) : rows
  const events = pageRows.map(mapAuditRow)

  const lastEvent = events.at(-1)
  const nextBefore = lastEvent?.created_at ?? null

  return { events, nextBefore: hasMore ? nextBefore : null, hasMore }
}
