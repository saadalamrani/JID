export const SYS_AUDIT_PAGE_SIZE = 50

export type SysAuditFilters = {
  actor?: string
  actionType?: string
  from?: string
  to?: string
  before?: string
}

export type SysAuditEvent = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  actor_id: string | null
  actor_name: string | null
  metadata: Record<string, unknown>
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export type SysAuditPageResult = {
  events: SysAuditEvent[]
  nextBefore: string | null
  hasMore: boolean
}
