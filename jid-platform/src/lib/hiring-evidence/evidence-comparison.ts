import type {
  AssessmentMethod,
  EvidenceComparisonCell,
  EvidenceComparisonGrid,
  EvidenceComparisonRow,
} from '@/types/contracts/hiring-evidence'

/**
 * Builds the evidence comparison grid: applications down the rows, role criteria
 * across the columns, each cell holding the *distinct* submitted anchor points
 * and evidence-presence counts for one (criterion, method).
 *
 * Hard rule: this module never produces a per-application total, average, rank,
 * match percentage, or recommendation. Anchor points from different evaluators
 * are listed side by side, not combined. `assertNoAggregate` guards callers.
 */

export type ComparisonObservationInput = {
  applicationId: string
  criterionId: string
  method: AssessmentMethod
  evaluatorId: string
  evidenceFound: boolean
}

export type ComparisonRatingInput = {
  applicationId: string
  criterionId: string
  method: AssessmentMethod
  evaluatorId: string
  rubricVersionId: string | null
  anchorPoint: number | null
  /** Only ratings whose evaluator has submitted their scorecard are comparable. */
  scorecardSubmitted: boolean
}

export type ComparisonCriterion = {
  criterionId: string
  labelAr: string
  labelEn: string
  method: AssessmentMethod
  sortOrder: number
}

export type ComparisonApplication = {
  applicationId: string
  applicantRef: string
}

function cellKey(applicationId: string, criterionId: string, method: AssessmentMethod): string {
  return `${applicationId}::${criterionId}::${method}`
}

export function buildEvidenceComparisonGrid(input: {
  hiringRoleId: string
  stageId: string | null
  criteria: readonly ComparisonCriterion[]
  applications: readonly ComparisonApplication[]
  observations: readonly ComparisonObservationInput[]
  ratings: readonly ComparisonRatingInput[]
}): EvidenceComparisonGrid {
  const orderedCriteria = [...input.criteria].sort((a, b) => a.sortOrder - b.sortOrder)

  const cellMap = new Map<
    string,
    {
      rubricVersionId: string | null
      anchorPoints: (number | null)[]
      observationCount: number
      evidenceFoundCount: number
      evidenceMissingCount: number
    }
  >()

  for (const crit of orderedCriteria) {
    for (const app of input.applications) {
      cellMap.set(cellKey(app.applicationId, crit.criterionId, crit.method), {
        rubricVersionId: null,
        anchorPoints: [],
        observationCount: 0,
        evidenceFoundCount: 0,
        evidenceMissingCount: 0,
      })
    }
  }

  for (const obs of input.observations) {
    const cell = cellMap.get(cellKey(obs.applicationId, obs.criterionId, obs.method))
    if (!cell) continue
    cell.observationCount += 1
    if (obs.evidenceFound) cell.evidenceFoundCount += 1
    else cell.evidenceMissingCount += 1
  }

  for (const rating of input.ratings) {
    if (!rating.scorecardSubmitted) continue
    const cell = cellMap.get(cellKey(rating.applicationId, rating.criterionId, rating.method))
    if (!cell) continue
    cell.anchorPoints.push(rating.anchorPoint)
    if (rating.rubricVersionId && !cell.rubricVersionId) {
      cell.rubricVersionId = rating.rubricVersionId
    }
  }

  const rows: EvidenceComparisonRow[] = input.applications.map((app) => {
    const cells: EvidenceComparisonCell[] = orderedCriteria.map((crit) => {
      const cell = cellMap.get(cellKey(app.applicationId, crit.criterionId, crit.method))!
      return {
        applicationId: app.applicationId,
        criterionId: crit.criterionId,
        method: crit.method,
        rubricVersionId: cell.rubricVersionId,
        submittedAnchorPoints: dedupeStable(cell.anchorPoints),
        observationCount: cell.observationCount,
        evidenceFoundCount: cell.evidenceFoundCount,
        evidenceMissingCount: cell.evidenceMissingCount,
      }
    })
    return { applicationId: app.applicationId, applicantRef: app.applicantRef, cells }
  })

  return {
    hiringRoleId: input.hiringRoleId,
    stageId: input.stageId,
    criteria: orderedCriteria.map((c) => ({
      criterionId: c.criterionId,
      labelAr: c.labelAr,
      labelEn: c.labelEn,
    })),
    rows,
  }
}

function dedupeStable(values: readonly (number | null)[]): (number | null)[] {
  const seen = new Set<string>()
  const out: (number | null)[] = []
  for (const v of values) {
    const key = v === null ? 'null' : String(v)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(v)
  }
  return out
}

/**
 * Defensive guard: throws if a caller tries to attach anything that looks like a
 * universal score / rank / match percentage to a comparison payload.
 */
const BANNED_AGGREGATE_KEYS = [
  'score',
  'totalscore',
  'total',
  'overallscore',
  'rank',
  'ranking',
  'matchpercent',
  'matchpercentage',
  'match',
  'fit',
  'fitscore',
  'culturefit',
  'percentile',
  'grade',
  'average',
  'weightedscore',
]

export function assertNoAggregate(payload: unknown, context = 'comparison payload'): void {
  const walk = (value: unknown, path: string): void => {
    if (value === null || typeof value !== 'object') return
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`))
      return
    }
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      const normalized = key.toLowerCase().replace(/[_\s-]/g, '')
      if (BANNED_AGGREGATE_KEYS.includes(normalized)) {
        throw new Error(
          `${context}: forbidden aggregate field "${key}" at ${path}.${key}. ` +
            'Wave 6 never emits a universal candidate score, rank, or match percentage.',
        )
      }
      walk(v, `${path}.${key}`)
    }
  }
  walk(payload, context)
}
