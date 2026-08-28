/**
 * P1-A — deterministic dense projection ordering.
 *
 * Legacy CV fact rows commonly all carry `sort_order = 0`, so the raw legacy
 * value must NOT be copied into the uniqueness-constrained
 * `cv_projection_items (section_id, sort_order)`. Instead the final projection
 * order is derived, then densely re-ranked:
 *
 *   1. legacy sort_order ASC
 *   2. stable legacy row identifier ASC  (deterministic tie-breaker)
 *   3. first-seen sequence ASC           (final tie-breaker within a batch)
 *
 * The result is deterministic, restart-safe and repeatable.
 *
 * Additionally: exactly one projection item exists per (cv_id, evidence_id).
 * When several legacy source rows deduplicate to the same canonical evidence
 * root, they collapse to ONE item that takes the earliest derived position;
 * every source row is still retained in the reconciliation ledger.
 *
 * The database mirror is section 6 of migration 20260827120001.
 */
export interface LegacyProjectionSource {
  evidenceId: string
  legacySortOrder: number
  legacyTiebreak: string
  firstSeq: number
}

export interface DenseProjectionItem {
  evidenceId: string
  sortOrder: number
}

export function deriveDenseProjectionOrder(
  sources: LegacyProjectionSource[],
): DenseProjectionItem[] {
  // Collapse to one entry per evidence root, keeping the earliest derived position.
  const byEvidence = new Map<string, LegacyProjectionSource>()
  for (const s of sources) {
    const current = byEvidence.get(s.evidenceId)
    if (current === undefined || compareSources(s, current) < 0) {
      byEvidence.set(s.evidenceId, s)
    }
  }

  return [...byEvidence.values()]
    .sort(compareSources)
    .map((s, index) => ({ evidenceId: s.evidenceId, sortOrder: index }))
}

function compareSources(a: LegacyProjectionSource, b: LegacyProjectionSource): number {
  if (a.legacySortOrder !== b.legacySortOrder) return a.legacySortOrder - b.legacySortOrder
  if (a.legacyTiebreak !== b.legacyTiebreak) return a.legacyTiebreak < b.legacyTiebreak ? -1 : 1
  return a.firstSeq - b.firstSeq
}
