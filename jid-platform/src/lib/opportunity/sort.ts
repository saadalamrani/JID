import type { OpportunityDiscoveryItem } from './discovery-types'

/**
 * Deterministic discovery order: soonest evidence-backed deadline first,
 * then newest published/confirmed, then stable opportunity_id.
 * Never boost, popularity, match %, or personalized ranking.
 */
export function compareOpportunityDiscovery(
  a: OpportunityDiscoveryItem,
  b: OpportunityDiscoveryItem,
): number {
  const aDeadline = a.expires_at ? Date.parse(a.expires_at) : Number.POSITIVE_INFINITY
  const bDeadline = b.expires_at ? Date.parse(b.expires_at) : Number.POSITIVE_INFINITY
  if (aDeadline !== bDeadline) return aDeadline - bDeadline

  const aFresh = Date.parse(a.last_confirmed_at ?? a.published_at ?? '') || 0
  const bFresh = Date.parse(b.last_confirmed_at ?? b.published_at ?? '') || 0
  if (aFresh !== bFresh) return bFresh - aFresh

  return a.opportunity_id.localeCompare(b.opportunity_id)
}

export function sortOpportunityDiscovery(
  items: readonly OpportunityDiscoveryItem[],
): OpportunityDiscoveryItem[] {
  return [...items].sort(compareOpportunityDiscovery)
}
