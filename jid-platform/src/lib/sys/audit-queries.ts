import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { resolveAuditActionFilter } from '@/lib/sys/audit-catalog'
import type { SysAuditEvent, SysAuditFilters, SysAuditPageResult } from '@/types/sys-audit'
import { SYS_AUDIT_PAGE_SIZE } from '@/types/sys-audit'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function resolveActorIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actorQuery: string,
): Promise<string[]> {
  const trimmed = actorQuery.trim()
  if (!trimmed) return []

  if (UUID_RE.test(trimmed)) return [trimmed]

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('full_name', `%${trimmed.replace(/[%_\\]/g, '\\$&')}%`)
    .limit(50)

  if (error) throw new Error(error.message)
  const ids = (data ?? []).map((row) => row.id)
  return ids.length > 0 ? ids : []
}

type AuditRow = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  actor_id: string | null
  metadata: unknown
  old_data: unknown
  new_data: unknown
  ip_address: unknown
  user_agent: string | null
  created_at: string
  actor: { full_name: string | null } | null
}

function mapAuditRow(row: AuditRow): SysAuditEvent {
  return {
    id: row.id,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    actor_id: row.actor_id,
    actor_name: row.actor?.full_name ?? null,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    old_data: (row.old_data ?? null) as Record<string, unknown> | null,
    new_data: (row.new_data ?? null) as Record<string, unknown> | null,
    ip_address: row.ip_address ? String(row.ip_address) : null,
    user_agent: row.user_agent,
    created_at: row.created_at,
  }
}

/** Section 10 — cursor-paginated audit timeline (created_at as performed_at). */
export async function fetchSysAuditTimeline(
  filters: SysAuditFilters = {},
): Promise<SysAuditPageResult> {
  const supabase = await createClient()
  const pageSize = SYS_AUDIT_PAGE_SIZE

  const actorFilter = filters.actor?.trim()
  let actorIds: string[] | null = null
  if (actorFilter) {
    actorIds = await resolveActorIds(supabase, actorFilter)
    if (actorIds.length === 0) {
      return { events: [], nextBefore: null, hasMore: false }
    }
  }

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
      ip_address,
      user_agent,
      created_at,
      actor:profiles!audit_logs_actor_id_fkey(full_name)
    `,
    )
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

  if (actorIds) {
    query = query.in('actor_id', actorIds)
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

/** Fetch all matching rows for CSV export (batched). */
export async function* iterateSysAuditExport(
  filters: SysAuditFilters,
): AsyncGenerator<SysAuditEvent[]> {
  let before = filters.before
  for (;;) {
    const page = await fetchSysAuditTimeline({ ...filters, before })
    if (page.events.length === 0) break
    yield page.events
    if (!page.hasMore || !page.nextBefore) break
    before = page.nextBefore
  }
}
