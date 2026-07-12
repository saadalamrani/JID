export const STAFF_AUDIT_PAGE_SIZE = 200

export type StaffAuditFilters = {
  actionType?: string
  entityType?: string
  entityId?: string
  from?: string
  to?: string
  before?: string
}

export type StaffAuditEvent = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  actor_id: string | null
  metadata: Record<string, unknown>
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
}

export type StaffAuditPageResult = {
  events: StaffAuditEvent[]
  nextBefore: string | null
  hasMore: boolean
}
