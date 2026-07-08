'use client'

import { formatDistance } from 'date-fns'
import { arSA } from 'date-fns/locale'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import {
  getClaimUrgencyTier,
  hoursUntilSla,
  URGENCY_BORDER_CLASS,
  type ClaimUrgencyTier,
} from '@/lib/staff/claim-urgency'
import type { StaffClaimsQueueItem } from '@/lib/staff/claims-queue'
import { cn } from '@/lib/utils'

type ClaimCardProps = {
  item: StaffClaimsQueueItem
  showAssignment?: boolean
}

const TYPE_BADGE_LABEL: Record<StaffClaimsQueueItem['queueType'], string> = {
  company: 'شركة',
  university: 'جامعة',
  mentor: 'مرشد',
}

const TYPE_BADGE_CLASS: Record<StaffClaimsQueueItem['queueType'], string> = {
  company: 'bg-primary/10 text-primary',
  university: 'bg-blue-100 text-blue-800',
  mentor: 'bg-purple-100 text-purple-800',
}

function formatSlaCountdown(slaDueAt: string, tier: ClaimUrgencyTier): string {
  if (tier === 'overdue') return 'تجاوز SLA'

  const hours = hoursUntilSla(slaDueAt)
  if (hours < 1) {
    return `متبقٍ ${Math.max(1, Math.ceil(hours * 60))} دقيقة`
  }
  return `متبقٍ ${Math.ceil(hours)} ساعة`
}

/** Section 7.1 — urgency-colored claim card with Arabic SLA countdown. */
export function ClaimCard({ item, showAssignment = true }: ClaimCardProps) {
  const t = useTranslations('staff.claims.card')
  const tier = getClaimUrgencyTier(item.slaDueAt)
  const submittedLabel = formatDistance(new Date(item.submittedAt), new Date(), {
    addSuffix: true,
    locale: arSA,
  })

  return (
    <article
      className={cn(
        'rounded-lg border border-border bg-card ps-0 transition-colors hover:bg-background/30',
        URGENCY_BORDER_CLASS[tier],
      )}
    >
      <Link href={item.href} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                TYPE_BADGE_CLASS[item.queueType],
              )}
            >
              {TYPE_BADGE_LABEL[item.queueType]}
            </span>
            <span className="text-xs text-muted-foreground">{item.status}</span>
          </div>
          <div>
            <p className="font-medium text-foreground">{item.applicantName}</p>
            <p className="text-sm text-muted-foreground">{item.targetEntityName}</p>
          </div>
          <p className="text-xs text-muted-foreground">{submittedLabel}</p>
        </div>

        <div className="shrink-0 text-end sm:min-w-[8rem]">
          <p
            className={cn(
              'text-sm font-semibold',
              tier === 'overdue'
                ? 'text-destructive'
                : tier === 'critical'
                  ? 'text-orange-600'
                  : tier === 'warning'
                    ? 'text-sem-warning'
                    : 'text-muted-foreground',
            )}
          >
            {formatSlaCountdown(item.slaDueAt, tier)}
          </p>
          {showAssignment ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {item.assignedStaffId ? t('assigned') : t('unassigned')}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  )
}
