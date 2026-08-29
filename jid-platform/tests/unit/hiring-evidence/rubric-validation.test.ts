import { describe, expect, it } from 'vitest'
import {
  isAnchorPointInScale,
  validateRubricAnchors,
} from '@/lib/hiring-evidence/rubric-validation'

const anchor = (point: number) => ({
  point,
  descriptorAr: `مرساة ${point}`,
  descriptorEn: `anchor ${point}`,
})

describe('validateRubricAnchors', () => {
  it('accepts a well-formed 3-point anchored rubric', () => {
    const result = validateRubricAnchors(3, [anchor(1), anchor(2), anchor(3)])
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.scalePoints).toBe(3)
      expect(result.anchors.map((a) => a.point)).toEqual([1, 2, 3])
    }
  })

  it('sorts anchors by point on success', () => {
    const result = validateRubricAnchors(3, [anchor(3), anchor(1), anchor(2)])
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.anchors.map((a) => a.point)).toEqual([1, 2, 3])
  })

  it('rejects an invalid scale size', () => {
    const result = validateRubricAnchors(6, [anchor(1), anchor(2)])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[0]?.code).toBe('INVALID_SCALE')
  })

  it('rejects the wrong number of anchors', () => {
    const result = validateRubricAnchors(5, [anchor(1), anchor(2), anchor(3)])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.code === 'ANCHOR_COUNT_MISMATCH')).toBe(true)
    }
  })

  it('rejects gaps or duplicate points', () => {
    const gap = validateRubricAnchors(3, [anchor(1), anchor(2), anchor(4)])
    expect(gap.ok).toBe(false)
    const dupe = validateRubricAnchors(3, [anchor(1), anchor(2), anchor(2)])
    expect(dupe.ok).toBe(false)
    if (!dupe.ok) {
      expect(dupe.errors.some((e) => e.code === 'ANCHOR_POINTS_NOT_CONTIGUOUS')).toBe(true)
    }
  })

  it('requires both Arabic and English descriptors on every anchor', () => {
    const result = validateRubricAnchors(3, [
      anchor(1),
      { point: 2, descriptorAr: '   ', descriptorEn: 'anchor 2' },
      anchor(3),
    ])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const err = result.errors.find((e) => e.code === 'ANCHOR_DESCRIPTOR_EMPTY')
      expect(err && 'point' in err ? err.point : null).toBe(2)
    }
  })
})

describe('isAnchorPointInScale', () => {
  it('allows null as "insufficient evidence to rate"', () => {
    expect(isAnchorPointInScale(null, 5)).toBe(true)
  })

  it('allows integers within 1..scale', () => {
    expect(isAnchorPointInScale(1, 5)).toBe(true)
    expect(isAnchorPointInScale(5, 5)).toBe(true)
  })

  it('rejects out-of-range or non-integer points', () => {
    expect(isAnchorPointInScale(0, 5)).toBe(false)
    expect(isAnchorPointInScale(6, 5)).toBe(false)
    expect(isAnchorPointInScale(2.5, 5)).toBe(false)
  })
})
