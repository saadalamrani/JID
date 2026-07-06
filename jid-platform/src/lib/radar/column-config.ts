import type { ApplicationStatus, UserApplication } from '@/types/application'

/** Section 7.1 / 7.4 — Radar Kanban column identifiers (4 columns). */
export const RADAR_COLUMN_IDS = [
  'saved',
  'applied',
  'under_review',
  'archived',
] as const

export type RadarColumnId = (typeof RADAR_COLUMN_IDS)[number]

export type RadarColumnConfig = {
  id: RadarColumnId
  /** next-intl key under radar.columns.* */
  labelKey: `radar.columns.${string}`
  statuses: readonly ApplicationStatus[]
  /** Section 7.1 — user may drag cards out of this column. */
  allowsManualDrag: boolean
  /** Section 7.1 — column accepts manual drops from other columns. */
  allowsManualDrop: boolean
  /** Section 7.1 — archived lane: cards cannot be dragged out. */
  isReadOnly: boolean
}

/**
 * Section 7.1 — COLUMNS definition.
 * Manual drag: `saved` + interview (`invited` in `under_review`).
 * Manual drop target: `archived` only.
 */
export const RADAR_COLUMNS: readonly RadarColumnConfig[] = [
  {
    id: 'saved',
    labelKey: 'radar.columns.saved',
    statuses: ['saved'],
    allowsManualDrag: true,
    allowsManualDrop: false,
    isReadOnly: false,
  },
  {
    id: 'applied',
    labelKey: 'radar.columns.applied',
    statuses: ['pending', 'submitted'],
    allowsManualDrag: false,
    allowsManualDrop: false,
    isReadOnly: false,
  },
  {
    id: 'under_review',
    labelKey: 'radar.columns.under_review',
    statuses: ['under_review', 'invited'],
    allowsManualDrag: true,
    allowsManualDrop: false,
    isReadOnly: false,
  },
  {
    id: 'archived',
    labelKey: 'radar.columns.archived',
    statuses: ['shortlisted', 'rejected', 'withdrawn', 'expired'],
    allowsManualDrag: false,
    allowsManualDrop: true,
    isReadOnly: true,
  },
] as const

/** Section 7.4 — archived lane sub-statuses shown as badges on cards. */
export const ARCHIVED_SUB_STATUSES = ['shortlisted', 'rejected', 'expired'] as const
export type ArchivedSubStatus = (typeof ARCHIVED_SUB_STATUSES)[number]

export function isArchivedSubStatus(status: ApplicationStatus): status is ArchivedSubStatus {
  return (ARCHIVED_SUB_STATUSES as readonly string[]).includes(status)
}

const STATUS_TO_COLUMN = new Map<ApplicationStatus, RadarColumnId>(
  RADAR_COLUMNS.flatMap((column) =>
    column.statuses.map((status) => [status, column.id] as const),
  ),
)

export function columnForApplicationStatus(status: ApplicationStatus): RadarColumnId | null {
  return STATUS_TO_COLUMN.get(status) ?? null
}

export function getRadarColumn(id: RadarColumnId): RadarColumnConfig {
  const column = RADAR_COLUMNS.find((entry) => entry.id === id)
  if (!column) {
    throw new Error(`Unknown radar column: ${id}`)
  }
  return column
}

/**
 * Section 7.1 — interview column drag: only `invited` cards in `under_review`.
 * `saved` column always draggable.
 */
export function canDragApplication(
  columnId: RadarColumnId,
  status: ApplicationStatus,
): boolean {
  const column = getRadarColumn(columnId)
  if (!column.allowsManualDrag || column.isReadOnly) return false
  if (columnId === 'saved') return true
  if (columnId === 'under_review') return status === 'invited'
  return false
}

export function groupApplicationsByColumn(
  applications: UserApplication[],
): Record<RadarColumnId, UserApplication[]> {
  const grouped = Object.fromEntries(
    RADAR_COLUMN_IDS.map((id) => [id, [] as UserApplication[]]),
  ) as Record<RadarColumnId, UserApplication[]>

  for (const application of applications) {
    const columnId = columnForApplicationStatus(application.status)
    if (!columnId) continue
    grouped[columnId].push(application)
  }

  return grouped
}

export type DragApplicationData = {
  type: 'application'
  application: UserApplication
  columnId: RadarColumnId
}

export type DragColumnData = {
  type: 'column'
  columnId: RadarColumnId
}

export function isColumnDroppableId(id: string): boolean {
  return id.startsWith('column:')
}

export function columnIdFromDroppable(id: string): RadarColumnId | null {
  if (!isColumnDroppableId(id)) return null
  const raw = id.replace('column:', '') as RadarColumnId
  return (RADAR_COLUMN_IDS as readonly string[]).includes(raw) ? raw : null
}

export function droppableIdForColumn(columnId: RadarColumnId): string {
  return `column:${columnId}`
}
