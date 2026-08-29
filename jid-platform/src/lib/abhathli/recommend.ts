import type { AbhathliRecommendation } from './types'

/**
 * Rank by explicit criteria coverage, then sooner deadline, then stable id.
 * Never emit a match percentage.
 */
export function rankAbhathliRecommendations(
  recommendations: readonly AbhathliRecommendation[],
): AbhathliRecommendation[] {
  return [...recommendations].sort((a, b) => {
    const aRatio = a.matched_count / Math.max(1, a.required_count)
    const bRatio = b.matched_count / Math.max(1, b.required_count)
    if (aRatio !== bRatio) return bRatio - aRatio
    const aExpiry = a.expires_at ? Date.parse(a.expires_at) : Number.POSITIVE_INFINITY
    const bExpiry = b.expires_at ? Date.parse(b.expires_at) : Number.POSITIVE_INFINITY
    if (aExpiry !== bExpiry) return aExpiry - bExpiry
    return a.opportunity_id.localeCompare(b.opportunity_id)
  })
}
