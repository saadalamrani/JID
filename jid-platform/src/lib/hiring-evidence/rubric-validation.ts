import type { RubricScalePoints } from '@/types/contracts/hiring-evidence'

/**
 * Pure validation of an anchored-rubric version, mirroring the guards in the
 * `publish_hiring_rubric_version` RPC so the UI can fail fast with the same rules.
 *
 * A valid anchored rubric:
 *  - uses a 3, 4, or 5 point scale;
 *  - has exactly `scalePoints` anchors;
 *  - covers points 1..scalePoints with no gaps or duplicates;
 *  - gives every anchor a non-empty Arabic AND English descriptor.
 *
 * There is deliberately no "passing" anchor, no weight, and no numeric meaning
 * beyond ordering: a higher point means stronger evidence of the required
 * behavior, never "a better person".
 */

export type RubricAnchorInput = {
  point: number
  descriptorAr: string
  descriptorEn: string
}

export type RubricValidationError =
  | { code: 'INVALID_SCALE'; message: string }
  | { code: 'ANCHOR_COUNT_MISMATCH'; message: string }
  | { code: 'ANCHOR_POINTS_NOT_CONTIGUOUS'; message: string }
  | { code: 'ANCHOR_DESCRIPTOR_EMPTY'; message: string; point: number }

export type RubricValidationResult =
  | { ok: true; scalePoints: RubricScalePoints; anchors: readonly RubricAnchorInput[] }
  | { ok: false; errors: readonly RubricValidationError[] }

const VALID_SCALE_POINTS: readonly number[] = [3, 4, 5]

export function validateRubricAnchors(
  scalePoints: number,
  anchors: readonly RubricAnchorInput[],
): RubricValidationResult {
  const errors: RubricValidationError[] = []

  if (!VALID_SCALE_POINTS.includes(scalePoints)) {
    errors.push({
      code: 'INVALID_SCALE',
      message: 'A rubric scale must have 3, 4, or 5 points.',
    })
    // Without a valid scale the remaining checks are not meaningful.
    return { ok: false, errors }
  }

  if (anchors.length !== scalePoints) {
    errors.push({
      code: 'ANCHOR_COUNT_MISMATCH',
      message: `A ${scalePoints}-point scale needs exactly ${scalePoints} anchors; received ${anchors.length}.`,
    })
  }

  const sortedPoints = anchors.map((a) => a.point).sort((a, b) => a - b)
  const expected = Array.from({ length: scalePoints }, (_, i) => i + 1)
  const contiguous =
    sortedPoints.length === expected.length &&
    sortedPoints.every((p, i) => p === expected[i])
  if (!contiguous) {
    errors.push({
      code: 'ANCHOR_POINTS_NOT_CONTIGUOUS',
      message: `Anchor points must be exactly 1..${scalePoints} with no gaps or duplicates.`,
    })
  }

  for (const anchor of anchors) {
    if (anchor.descriptorAr.trim() === '' || anchor.descriptorEn.trim() === '') {
      errors.push({
        code: 'ANCHOR_DESCRIPTOR_EMPTY',
        message: 'Every anchor needs a non-empty Arabic and English descriptor.',
        point: anchor.point,
      })
    }
  }

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    scalePoints: scalePoints as RubricScalePoints,
    anchors: [...anchors].sort((a, b) => a.point - b.point),
  }
}

/**
 * Guard for a single rating: an anchor point is either null ("insufficient
 * evidence to rate", explicitly allowed) or an integer within the version scale.
 */
export function isAnchorPointInScale(
  anchorPoint: number | null,
  scalePoints: number,
): boolean {
  if (anchorPoint === null) return true
  return Number.isInteger(anchorPoint) && anchorPoint >= 1 && anchorPoint <= scalePoints
}
