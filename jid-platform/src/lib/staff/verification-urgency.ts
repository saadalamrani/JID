/** Section 7.1 — SLA urgency tiers (hours until sla_due_at). */
export type VerificationUrgencyTier = 'overdue' | 'critical' | 'warning' | 'normal'

export type VerificationUrgencyFilter = 'all' | 'overdue' | 'critical' | 'normal'

export const STAFF_SLA_DEFAULT_HOURS = 72

export function resolveSlaDueAt(slaDueAt: string | null, submittedAt: string): string {
  if (slaDueAt) return slaDueAt
  return new Date(
    new Date(submittedAt).getTime() + STAFF_SLA_DEFAULT_HOURS * 60 * 60 * 1000,
  ).toISOString()
}

export function hoursUntilSla(slaDueAt: string): number {
  return (new Date(slaDueAt).getTime() - Date.now()) / (1000 * 60 * 60)
}

export function getVerificationUrgencyTier(slaDueAt: string): VerificationUrgencyTier {
  const hours = hoursUntilSla(slaDueAt)
  if (hours < 0) return 'overdue'
  if (hours < 4) return 'critical'
  if (hours < 12) return 'warning'
  return 'normal'
}

/** Filter buckets: critical includes warning tier (<12h, not overdue). */
export function matchesUrgencyFilter(
  tier: VerificationUrgencyTier,
  filter: VerificationUrgencyFilter,
): boolean {
  if (filter === 'all') return true
  if (filter === 'overdue') return tier === 'overdue'
  if (filter === 'critical') return tier === 'critical' || tier === 'warning'
  return tier === 'normal'
}

export const URGENCY_BORDER_CLASS: Record<VerificationUrgencyTier, string> = {
  overdue: 'border-s-4 border-s-red-600',
  critical: 'border-s-4 border-s-orange-500',
  warning: 'border-s-4 border-s-amber-400',
  normal: 'border-s-4 border-s-gray-300',
}
