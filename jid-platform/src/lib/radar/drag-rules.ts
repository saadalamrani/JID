import type { ApplicationStatus } from '@/types/application'
import {
  canDragApplication,
  getRadarColumn,
  RADAR_COLUMN_IDS,
  type RadarColumnId,
} from '@/lib/radar/column-config'

/** Section 7.2 — exact toast when user tries to drag auto-managed cards. */
export const AUTO_MOVE_TOAST_AR =
  'هذي البطاقة تتحرك تلقائياً عند تحديث الشركة لحالة طلبك'

/**
 * Section 7.2 — allowed user-driven column transitions.
 * Valid manual moves: saved → archived, interview (invited) → archived.
 */
const ALLOWED_COLUMN_TRANSITIONS: Record<RadarColumnId, readonly RadarColumnId[]> = {
  saved: ['archived'],
  applied: [],
  under_review: ['archived'],
  archived: [],
}

export function canTransition(from: RadarColumnId, to: RadarColumnId): boolean {
  if (from === to) return true
  return ALLOWED_COLUMN_TRANSITIONS[from].includes(to)
}

export function shouldShowAutoMoveToast(
  columnId: RadarColumnId,
  status: ApplicationStatus,
): boolean {
  if (getRadarColumn(columnId).isReadOnly) return true
  if (columnId === 'applied') return true
  if (columnId === 'under_review' && status !== 'invited') return true
  if (!canDragApplication(columnId, status)) return true
  return false
}

export function isValidManualDrop(
  from: RadarColumnId,
  to: RadarColumnId,
  status: ApplicationStatus,
): boolean {
  if (!canDragApplication(from, status)) return false
  if (!getRadarColumn(to).allowsManualDrop) return false
  return canTransition(from, to)
}

/** Section 11.1 — mobile bottom-sheet move targets from canTransition rules. */
export function getAllowedTargets(
  fromColumn: RadarColumnId,
  status: ApplicationStatus,
): RadarColumnId[] {
  return RADAR_COLUMN_IDS.filter(
    (toColumn) =>
      toColumn !== fromColumn && isValidManualDrop(fromColumn, toColumn, status),
  )
}
