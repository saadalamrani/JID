'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Zap } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useCallback } from 'react'
import { CompanyLogo } from '@/app/[locale]/(public)/catalog/_components/company-logo'
import type { UserApplication } from '@/types/application'
import type { RadarColumnId } from '@/lib/radar/column-config'
import { ARCHIVED_SUB_STATUS_LABELS } from '@/lib/radar/status-labels'
import { isArchivedSubStatus } from '@/lib/radar/column-config'
import { useGlowState } from '@/lib/hooks/use-glow-state'
import { useMarkApplicationSeen } from '@/lib/hooks/use-mark-application-seen'
import { computeDeadlineDaysLeft } from '@/lib/jobs/deadline'
import { formatRelativeTime } from '@/lib/utils/format-relative-time'
import { formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { JobAutoReplyDisclaimer } from '@/components/communication/job-auto-reply-disclaimer'
import { CommReceiptLine } from '@/components/communication/comm-receipt-line'
import { SsisTimelineLine } from '@/components/ssis/ssis-timeline-line'

type ApplicationCardProps = {
  application: UserApplication
  columnId: RadarColumnId
  userId: string
  allowDrag: boolean
  onBlockedDrag?: () => void
  overlay?: boolean
  className?: string
}

export function ApplicationCardContent({
  application,
  showGlow,
}: {
  application: UserApplication
  showGlow: boolean
}) {
  const locale = useLocale() as 'ar' | 'en'
  const job = application.job
  const company = application.company
  const title = job?.title_ar || job?.title_en || '—'
  const companyName = company?.name_ar || company?.name_en || '—'
  const declaredAt = application.submitted_at ?? application.created_at
  const daysUntilDeadline =
    job?.application_deadline != null
      ? computeDeadlineDaysLeft(job.application_deadline)
      : null

  const showArchivedBadge = isArchivedSubStatus(application.status)

  return (
    <>
      {showGlow ? (
        <div
          className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 font-arabic text-[10px] font-semibold text-foreground"
          role="status"
        >
          <Zap className="h-3 w-3 shrink-0 text-accent" aria-hidden />
          <span>تحديث من الشركة</span>
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <CompanyLogo name={companyName} logoUrl={company?.logo_url ?? null} className="h-10 w-10" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 font-arabic text-sm font-semibold text-foreground">{title}</h3>
            {showArchivedBadge ? (
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 font-arabic text-[10px] font-medium',
                  application.status === 'rejected' && 'bg-red-50 text-red-800',
                  application.status === 'shortlisted' && 'bg-emerald-50 text-emerald-800',
                  application.status === 'expired' && 'bg-border/30 text-muted-foreground',
                )}
              >
                {ARCHIVED_SUB_STATUS_LABELS[application.status as keyof typeof ARCHIVED_SUB_STATUS_LABELS]}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate font-arabic text-xs text-muted-foreground">{companyName}</p>
        </div>
      </div>

      <footer className="mt-3 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 font-arabic text-[11px] text-foreground/55">
          <span>{formatRelativeTime(declaredAt)}</span>
          {daysUntilDeadline != null ? (
            <span>
              {daysUntilDeadline <= 0
                ? 'انتهى الموعد'
                : `${formatNumber(daysUntilDeadline, locale)} يوم للإغلاق`}
            </span>
          ) : null}
        </div>
        <CommReceiptLine applicationId={application.id} />
        <SsisTimelineLine applicationId={application.id} />
        {application.job_id ? (
          <JobAutoReplyDisclaimer jobId={application.job_id} />
        ) : null}
      </footer>
    </>
  )
}

/** Section 7.4 / 7.5 / 7.6 — sortable card with glow + viewport seen tracking. */
export function ApplicationCard({
  application,
  columnId,
  userId,
  allowDrag,
  onBlockedDrag,
  overlay = false,
  className,
}: ApplicationCardProps) {
  const showGlow = useGlowState(application, userId)
  const { setCardRef } = useMarkApplicationSeen(application.id, userId, showGlow && !overlay)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
    data: {
      type: 'application',
      application,
      columnId,
    },
    disabled: !allowDrag || overlay,
  })

  const mergedRef = useCallback(
    (node: HTMLElement | null) => {
      setNodeRef(node)
      setCardRef(node)
    },
    [setCardRef, setNodeRef],
  )

  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      }

  function handleBlockedPointerDown(event: React.PointerEvent) {
    if (allowDrag) return
    event.preventDefault()
    event.stopPropagation()
    onBlockedDrag?.()
  }

  if (overlay) {
    return (
      <article
        className={cn(
          'rounded-xl border border-border bg-card p-3 shadow-sm touch-manipulation',
          className,
        )}
      >
        <ApplicationCardContent application={application} showGlow={false} />
      </article>
    )
  }

  return (
    <article
      ref={mergedRef}
      style={style}
      className={cn(
        'rounded-xl border bg-card p-3 shadow-sm touch-manipulation transition-shadow',
        showGlow
          ? 'animate-pulse border-border shadow-[0_0_0_2px_rgba(230,180,58,0.28)]'
          : 'border-border',
        allowDrag && 'cursor-grab active:cursor-grabbing',
        isDragging && 'z-50 opacity-40',
        className,
      )}
      {...(allowDrag ? { ...attributes, ...listeners } : {})}
      onPointerDown={allowDrag ? undefined : handleBlockedPointerDown}
    >
      <ApplicationCardContent application={application} showGlow={showGlow} />
    </article>
  )
}
