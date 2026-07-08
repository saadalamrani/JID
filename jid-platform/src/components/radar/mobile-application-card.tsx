'use client'

import { MoreHorizontal } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ApplicationCardContent } from '@/components/radar/application-card'
import { useGlowState } from '@/lib/hooks/use-glow-state'
import { useMarkApplicationSeen } from '@/lib/hooks/use-mark-application-seen'
import { useUpdateApplicationStatus } from '@/lib/hooks/use-radar-mutations'
import { statusForRadarColumnTransition } from '@/lib/radar/applicant-status-transitions'
import type { RadarColumnId } from '@/lib/radar/column-config'
import {
  AUTO_MOVE_TOAST_AR,
  getAllowedTargets,
  shouldShowAutoMoveToast,
} from '@/lib/radar/drag-rules'
import type { UserApplication } from '@/types/application'
import { track } from '@/lib/analytics/track'
import { cn } from '@/lib/utils'

type MobileApplicationCardProps = {
  application: UserApplication
  columnId: RadarColumnId
  userId: string
}

/** Section 11.1 — static mobile card + bottom-sheet move actions. */
export function MobileApplicationCard({
  application,
  columnId,
  userId,
}: MobileApplicationCardProps) {
  const t = useTranslations('radar')
  const tColumns = useTranslations('radar.columns')
  const [sheetOpen, setSheetOpen] = useState(false)
  const showGlow = useGlowState(application, userId)
  const { setCardRef } = useMarkApplicationSeen(application.id, userId, showGlow)
  const updateApplicationStatus = useUpdateApplicationStatus(userId)

  const allowedTargets = getAllowedTargets(columnId, application.status)

  const cardRef = useCallback(
    (node: HTMLElement | null) => {
      setCardRef(node)
    },
    [setCardRef],
  )

  function openActions() {
    if (shouldShowAutoMoveToast(columnId, application.status)) {
      toast.message(AUTO_MOVE_TOAST_AR)
      track('radar_card_drag_blocked', {
        application_id: application.id,
        from_column: columnId,
        reason: 'auto_managed',
        method: 'mobile_sheet',
      })
      return
    }
    setSheetOpen(true)
  }

  function handleMove(targetColumn: RadarColumnId) {
    const nextStatus = statusForRadarColumnTransition(columnId, targetColumn)
    if (!nextStatus) {
      toast.message(AUTO_MOVE_TOAST_AR)
      track('radar_card_drag_blocked', {
        application_id: application.id,
        from_column: columnId,
        to_column: targetColumn,
        reason: 'no_status_mapping',
        method: 'mobile_sheet',
      })
      return
    }

    track('radar_card_dragged', {
      application_id: application.id,
      from_column: columnId,
      to_column: targetColumn,
      method: 'mobile_sheet',
    })

    setSheetOpen(false)
    updateApplicationStatus.mutate(
      {
        applicationId: application.id,
        status: nextStatus,
        fromColumn: columnId,
        toColumn: targetColumn,
      },
      {
        onError: (error) => toast.error(error.message),
      },
    )
  }

  return (
    <>
      <article
        ref={cardRef}
        className={cn(
          'relative rounded-xl border bg-card p-3 shadow-sm transition-shadow',
          showGlow
            ? 'animate-pulse border-border shadow-[0_0_0_2px_rgba(230,180,58,0.28)]'
            : 'border-border',
        )}
      >
        <button
          type="button"
          className="absolute end-2 top-2 rounded-lg p-1.5 text-muted-foreground hover:bg-background/40 hover:text-foreground"
          aria-label={t('mobile.cardActions')}
          onClick={openActions}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden />
        </button>

        <div className="pe-8">
          <ApplicationCardContent application={application} showGlow={showGlow} />
        </div>
      </article>

      <BottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={t('mobile.moveTitle')}
      >
        {allowedTargets.length === 0 ? (
          <p className="font-arabic text-sm text-muted-foreground">{t('mobile.noMoves')}</p>
        ) : (
          <ul className="space-y-2">
            {allowedTargets.map((targetColumn) => (
              <li key={targetColumn}>
                <button
                  type="button"
                  className="w-full rounded-xl border border-border/50 bg-background/20 px-4 py-3 text-start font-arabic text-sm font-medium text-foreground hover:bg-background/40"
                  onClick={() => handleMove(targetColumn)}
                >
                  {t('mobile.moveTo', { column: tColumns(targetColumn) })}
                </button>
              </li>
            ))}
          </ul>
        )}
      </BottomSheet>
    </>
  )
}
