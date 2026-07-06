import type { ApplicationStatus } from '@/types/application'
import type { RadarColumnId } from '@/lib/radar/column-config'
import { columnForApplicationStatus } from '@/lib/radar/column-config'
import { canTransition, isValidManualDrop } from '@/lib/radar/drag-rules'

/** Section 7.2 / 9 — DB status when user archives via Radar drag. */
export function statusForRadarColumnTransition(
  fromColumn: RadarColumnId,
  toColumn: RadarColumnId,
): ApplicationStatus | null {
  if (!canTransition(fromColumn, toColumn)) return null
  if (toColumn !== 'archived') return null
  if (fromColumn === 'saved' || fromColumn === 'under_review') return 'withdrawn'
  return null
}

/**
 * Applicant-initiated status transitions allowed outside company/staff flows.
 * Mirrors Postgres guard in migration 065.
 */
const ALLOWED_APPLICANT_STATUS_TRANSITIONS: ReadonlyArray<
  readonly [ApplicationStatus, ApplicationStatus]
> = [
  ['saved', 'pending'],
  ['saved', 'withdrawn'],
  ['invited', 'withdrawn'],
  ['withdrawn', 'saved'],
  ['expired', 'saved'],
  ['rejected', 'saved'],
]

export function isAllowedApplicantStatusTransition(
  fromStatus: ApplicationStatus,
  toStatus: ApplicationStatus,
): boolean {
  if (fromStatus === toStatus) return true
  return ALLOWED_APPLICANT_STATUS_TRANSITIONS.some(
    ([from, to]) => from === fromStatus && to === toStatus,
  )
}

export function isValidApplicantRadarArchive(
  fromColumn: RadarColumnId,
  toColumn: RadarColumnId,
  fromStatus: ApplicationStatus,
  toStatus: ApplicationStatus,
): boolean {
  if (toStatus !== 'withdrawn') return false
  return isValidManualDrop(fromColumn, toColumn, fromStatus)
}

export function assertApplicantRadarStatusUpdate(input: {
  fromColumn: RadarColumnId
  toColumn: RadarColumnId
  fromStatus: ApplicationStatus
  toStatus: ApplicationStatus
}): void {
  if (!isAllowedApplicantStatusTransition(input.fromStatus, input.toStatus)) {
    throw new Error('انتقال الحالة غير مسموح')
  }

  if (input.toStatus === 'withdrawn') {
    if (
      !isValidApplicantRadarArchive(
        input.fromColumn,
        input.toColumn,
        input.fromStatus,
        input.toStatus,
      )
    ) {
      throw new Error('لا يمكن أرشفة هذه البطاقة يدوياً')
    }
    return
  }

  const resolvedColumn = columnForApplicationStatus(input.toStatus)
  if (resolvedColumn !== input.toColumn) {
    throw new Error('الحالة لا تطابق العمود المستهدف')
  }
}
