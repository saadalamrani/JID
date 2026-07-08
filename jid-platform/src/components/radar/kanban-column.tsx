'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTranslations } from 'next-intl'
import type { UserApplication } from '@/types/application'
import {
  canDragApplication,
  type RadarColumnConfig,
  droppableIdForColumn,
} from '@/lib/radar/column-config'
import { AUTO_MOVE_TOAST_AR } from '@/lib/radar/drag-rules'
import { ApplicationCard } from '@/components/radar/application-card'
import { EmptyColumnState } from '@/components/radar/empty-column-state'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { track } from '@/lib/analytics/track'

type KanbanColumnProps = {
  column: RadarColumnConfig
  userId: string
  applications: UserApplication[]
}

/** Section 7.4 / 7.5 — droppable column with sortable cards. */
export function KanbanColumn({ column, userId, applications }: KanbanColumnProps) {
  const t = useTranslations('radar.columns')
  const droppableId = droppableIdForColumn(column.id)

  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { type: 'column', columnId: column.id },
  })

  function handleBlockedDrag() {
    toast.message(AUTO_MOVE_TOAST_AR)
    track('radar_card_drag_blocked', { reason: 'auto_managed' })
  }

  return (
    <section
      aria-label={t(column.id)}
      className="flex min-h-[320px] flex-col rounded-xl border border-border/50 bg-background/15"
    >
      <header className="flex items-center justify-between border-b border-border/40 px-3 py-2.5">
        <h2 className="font-arabic text-sm font-semibold text-foreground">{t(column.id)}</h2>
        <span className="rounded-full bg-card px-2 py-0.5 font-arabic text-xs text-muted-foreground">
          {applications.length}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-2 p-2 transition-colors',
          isOver && column.allowsManualDrop && 'bg-primary/5 ring-1 ring-inset ring-jid-olive/20',
        )}
      >
        <SortableContext
          items={applications.map((application) => application.id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.length === 0 ? (
            <EmptyColumnState columnId={column.id} />
          ) : (
            applications.map((application) => {
              const allowDrag = canDragApplication(column.id, application.status)
              return (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  columnId={column.id}
                  userId={userId}
                  allowDrag={allowDrag}
                  onBlockedDrag={handleBlockedDrag}
                />
              )
            })
          )}
        </SortableContext>
      </div>
    </section>
  )
}
