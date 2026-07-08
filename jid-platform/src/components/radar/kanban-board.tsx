'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { track } from '@/lib/analytics/track'
import type { UserApplication } from '@/types/application'
import type { TimelineMeeting } from '@/types/timeline'
import {
  columnIdFromDroppable,
  groupApplicationsByColumn,
  type DragApplicationData,
  type RadarColumnId,
  RADAR_COLUMNS,
  canDragApplication,
} from '@/lib/radar/column-config'
import {
  AUTO_MOVE_TOAST_AR,
  isValidManualDrop,
  shouldShowAutoMoveToast,
} from '@/lib/radar/drag-rules'
import { statusForRadarColumnTransition } from '@/lib/radar/applicant-status-transitions'
import { useUpdateApplicationStatus } from '@/lib/hooks/use-radar-mutations'
import { KanbanColumn } from '@/components/radar/kanban-column'
import { MentorshipTimeline } from '@/components/radar/mentorship-timeline'
import { ApplicationCard } from '@/components/radar/application-card'

type KanbanBoardProps = {
  userId: string
  applications: UserApplication[]
  meetings: TimelineMeeting[]
}

function resolveTargetColumn(
  grouped: Record<RadarColumnId, UserApplication[]>,
  overId: string | undefined,
): RadarColumnId | null {
  if (!overId) return null

  const fromDroppable = columnIdFromDroppable(overId)
  if (fromDroppable) return fromDroppable

  for (const column of RADAR_COLUMNS) {
    if (grouped[column.id].some((application) => application.id === overId)) {
      return column.id
    }
  }

  return null
}

/** Section 5.2 / 7.5 / 9 — Kanban with optimistic status mutations. */
export function KanbanBoard({ userId, applications, meetings }: KanbanBoardProps) {
  const t = useTranslations('radar')
  const grouped = useMemo(() => groupApplicationsByColumn(applications), [applications])
  const updateApplicationStatus = useUpdateApplicationStatus(userId)
  const [activeApplication, setActiveApplication] = useState<UserApplication | null>(null)
  const [activeColumnId, setActiveColumnId] = useState<RadarColumnId | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  )

  const activeAllowDrag = useMemo(() => {
    if (!activeApplication || !activeColumnId) return false
    return canDragApplication(activeColumnId, activeApplication.status)
  }, [activeApplication, activeColumnId])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragApplicationData | undefined
    if (!data || data.type !== 'application') return

    setActiveApplication(data.application)
    setActiveColumnId(data.columnId)

    if (shouldShowAutoMoveToast(data.columnId, data.application.status)) {
      toast.message(AUTO_MOVE_TOAST_AR)
      track('radar_card_drag_blocked', {
        application_id: data.application.id,
        from_column: data.columnId,
        reason: 'auto_managed',
      })
    }
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      const data = active.data.current as DragApplicationData | undefined

      setActiveApplication(null)
      setActiveColumnId(null)

      if (!data || data.type !== 'application' || !over) return

      const sourceColumn = data.columnId
      const targetColumn = resolveTargetColumn(grouped, String(over.id))
      const application = data.application

      if (!targetColumn) return

      if (shouldShowAutoMoveToast(sourceColumn, application.status)) {
        toast.message(AUTO_MOVE_TOAST_AR)
        track('radar_card_drag_blocked', {
          application_id: application.id,
          from_column: sourceColumn,
          reason: 'auto_managed',
        })
        return
      }

      if (sourceColumn === targetColumn) return

      if (!isValidManualDrop(sourceColumn, targetColumn, application.status)) {
        toast.message(AUTO_MOVE_TOAST_AR)
        track('radar_card_drag_blocked', {
          application_id: application.id,
          from_column: sourceColumn,
          to_column: targetColumn,
          reason: 'invalid_drop',
        })
        return
      }

      const nextStatus = statusForRadarColumnTransition(sourceColumn, targetColumn)
      if (!nextStatus) {
        toast.message(AUTO_MOVE_TOAST_AR)
        track('radar_card_drag_blocked', {
          application_id: application.id,
          from_column: sourceColumn,
          to_column: targetColumn,
          reason: 'no_status_mapping',
        })
        return
      }

      track('radar_card_dragged', {
        application_id: application.id,
        from_column: sourceColumn,
        to_column: targetColumn,
        method: 'drag',
      })

      updateApplicationStatus.mutate(
        {
          applicationId: application.id,
          status: nextStatus,
          fromColumn: sourceColumn,
          toColumn: targetColumn,
        },
        {
          onError: (error) => {
            toast.error(error.message)
          },
        },
      )
    },
    [grouped, updateApplicationStatus],
  )

  const handleDragCancel = useCallback(() => {
    setActiveApplication(null)
    setActiveColumnId(null)
  }, [])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 lg:w-3/4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {RADAR_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                userId={userId}
                applications={grouped[column.id]}
              />
            ))}
          </div>
        </div>

        <aside className="min-w-0 lg:w-1/4">
          <MentorshipTimeline
            userId={userId}
            meetings={meetings}
            title={t('timeline.title')}
          />
        </aside>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeApplication && activeColumnId ? (
          <ApplicationCard
            application={activeApplication}
            columnId={activeColumnId}
            userId={userId}
            allowDrag={activeAllowDrag}
            overlay
            className="rotate-1 shadow-lg ring-2 ring-primary/30"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
