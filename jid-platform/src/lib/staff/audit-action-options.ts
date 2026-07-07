import { getAuditCatalogEntry } from '@/lib/sys/audit-catalog'

/** Actions staff may perform — used for personal audit filter dropdown. */
const STAFF_AUDIT_ACTIONS = [
  'claim.approved',
  'claim.rejected',
  'entity.metadata_updated',
  'content_flag.resolved',
  'content_flag.resolved_hidden',
  'content_flag.dismissed',
  'user.suspended',
  'user.reinstated',
  'user.sessions_revoked',
  'mentor.approved',
  'mentor.rejected',
] as const

export function listStaffAuditActionFilterOptions(): Array<{ value: string; label: string }> {
  return STAFF_AUDIT_ACTIONS.map((action) => {
    const entry = getAuditCatalogEntry(action)
    return { value: action, label: entry.label }
  }).sort((a, b) => a.label.localeCompare(b.label))
}
