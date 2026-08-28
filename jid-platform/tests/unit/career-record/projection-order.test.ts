import { describe, expect, it } from 'vitest'
import {
  deriveDenseProjectionOrder,
  type LegacyProjectionSource,
} from '@/lib/career-record/projection-order'

/**
 * P1-A — deterministic dense projection ordering + one item per (cv_id, evidence_id).
 * DB mirror: section 6 of migration 20260827120001.
 */
describe('deriveDenseProjectionOrder', () => {
  it('assigns a dense unique order when every legacy sort_order is 0', () => {
    const sources: LegacyProjectionSource[] = [
      { evidenceId: 'e-c', legacySortOrder: 0, legacyTiebreak: 'row-3', firstSeq: 3 },
      { evidenceId: 'e-a', legacySortOrder: 0, legacyTiebreak: 'row-1', firstSeq: 1 },
      { evidenceId: 'e-b', legacySortOrder: 0, legacyTiebreak: 'row-2', firstSeq: 2 },
    ]
    expect(deriveDenseProjectionOrder(sources)).toEqual([
      { evidenceId: 'e-a', sortOrder: 0 },
      { evidenceId: 'e-b', sortOrder: 1 },
      { evidenceId: 'e-c', sortOrder: 2 },
    ])
  })

  it('honours legacy sort_order first, then the stable row-id tie-breaker', () => {
    const sources: LegacyProjectionSource[] = [
      { evidenceId: 'e-x', legacySortOrder: 5, legacyTiebreak: 'row-a', firstSeq: 1 },
      { evidenceId: 'e-y', legacySortOrder: 2, legacyTiebreak: 'row-z', firstSeq: 2 },
      { evidenceId: 'e-z', legacySortOrder: 2, legacyTiebreak: 'row-b', firstSeq: 3 },
    ]
    expect(deriveDenseProjectionOrder(sources).map((i) => i.evidenceId)).toEqual([
      'e-z',
      'e-y',
      'e-x',
    ])
  })

  it('collapses duplicate legacy sources for one evidence root into a single item', () => {
    const sources: LegacyProjectionSource[] = [
      { evidenceId: 'e-dup', legacySortOrder: 3, legacyTiebreak: 'row-9', firstSeq: 9 },
      { evidenceId: 'e-dup', legacySortOrder: 0, legacyTiebreak: 'row-1', firstSeq: 1 },
      { evidenceId: 'e-other', legacySortOrder: 1, legacyTiebreak: 'row-2', firstSeq: 2 },
    ]
    const result = deriveDenseProjectionOrder(sources)
    expect(result).toHaveLength(2)
    // e-dup keeps its earliest derived position (sort_order 0 beats e-other's 1)
    expect(result).toEqual([
      { evidenceId: 'e-dup', sortOrder: 0 },
      { evidenceId: 'e-other', sortOrder: 1 },
    ])
  })

  it('is deterministic and restart-safe (identical output on re-run, any input order)', () => {
    const sources: LegacyProjectionSource[] = [
      { evidenceId: 'e-1', legacySortOrder: 0, legacyTiebreak: 'b', firstSeq: 10 },
      { evidenceId: 'e-2', legacySortOrder: 0, legacyTiebreak: 'a', firstSeq: 20 },
      { evidenceId: 'e-3', legacySortOrder: 0, legacyTiebreak: 'c', firstSeq: 5 },
    ]
    const first = deriveDenseProjectionOrder(sources)
    const shuffled = deriveDenseProjectionOrder([...sources].reverse())
    expect(shuffled).toEqual(first)
    expect(deriveDenseProjectionOrder(first.map((i, idx) => ({
      evidenceId: i.evidenceId,
      legacySortOrder: 0,
      legacyTiebreak: sources.find((s) => s.evidenceId === i.evidenceId)!.legacyTiebreak,
      firstSeq: idx,
    })))).toEqual(first)
  })

  it('produces a contiguous 0..n-1 range with no gaps or collisions', () => {
    const sources: LegacyProjectionSource[] = Array.from({ length: 12 }, (_, i) => ({
      evidenceId: `e-${i}`,
      legacySortOrder: 0,
      legacyTiebreak: `row-${String(i).padStart(3, '0')}`,
      firstSeq: i,
    }))
    const orders = deriveDenseProjectionOrder(sources).map((i) => i.sortOrder)
    expect(orders).toEqual(Array.from({ length: 12 }, (_, i) => i))
  })
})
