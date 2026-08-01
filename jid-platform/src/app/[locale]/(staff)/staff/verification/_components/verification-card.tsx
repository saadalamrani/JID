'use client'

import { formatDistance } from 'date-fns'
import { arSA, enUS } from 'date-fns/locale'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import {
  getVerificationUrgencyTier,
  hoursUntilSla,
  URGENCY_BORDER_CLASS,
  type VerificationUrgencyTier,
} from '@/lib/staff/verification-urgency'
import type { StaffClaimsQueueItem } from '@/lib/staff/claims-queue'
import { cn } from '@/lib/utils'

type VerificationCardProps = {
  item: StaffClaimsQueueItem
  showAssignment?: boolean
}

/**
 * Wave 2A type badges — Business uses primary olive.
 * University keeps Spec 02-locked `bg-blue-100` distinction (behavior test).
 * Mentor uses secondary olive (no purple decorative accent).
 */
const TYPE_BADGE_CLASS: Record<StaffClaimsQueueItem['queueType'], string> = {
  business: 'bg-primary/10 text-primary',
  university: 'bg-blue-100 text-blue-800',
  mentor: 'bg-jid-olive-100 text-jid-olive',
}

/** PSW-002 — was hardcoded Arabic regardless of active locale; now goes through next-intl. */
function formatSlaCountdown(
  slaDueAt: string,
  tier: VerificationUrgencyTier,
  t: (key: string, values?: Record<string, number>) => string,
): string {
  if (tier === 'overdue') return t('sla.overdue')

  const hours = hoursUntilSla(slaDueAt)
  if (hours < 1) {
    return t('sla.minutesLeft', { minutes: Math.max(1, Math.ceil(hours * 60)) })
  }
  return t('sla.hoursLeft', { hours: Math.ceil(hours) })
}

/** Section 7.1 / Wave 2A — urgency-colored verification card with locale-aware SLA countdown. */
export function VerificationCard({ item, showAssignment = true }: VerificationCardProps) {
  const t = useTranslations('staff.claims.card')
  const locale = useLocale()
  const dateLocale = locale.startsWith('ar') ? arSA : enUS
  const tier = getVerificationUrgencyTier(item.slaDueAt)
  const typeLabel = t(`type.${item.queueType}`)
  const submittedLabel = formatDistance(new Date(item.submittedAt), new Date(), {
    addSuffix: true,
    locale: dateLocale,
  })

  return (
    <article
      className={cn(
        'rounded-lg border border-border bg-card ps-0 transition-colors hover:bg-jid-beige/40 focus-within:ring-2 focus-within:ring-jid-gold/60 focus-within:ring-offset-2',
        URGENCY_BORDER_CLASS[tier],
      )}
    >
      <Link
        href={item.href}
        className="flex flex-col gap-3 p-4 focus-visible:outline-none sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-xs font-semibold',
                TYPE_BADGE_CLASS[item.queueType],
              )}
            >
              {typeLabel}
            </span>
            <span className="text-xs font-medium text-foreground">{item.status}</span>
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
                : tier === 'critical' || tier === 'warning'
                  ? 'text-jid-olive'
                  : 'text-muted-foreground',
            )}
          >
            {formatSlaCountdown(item.slaDueAt, tier, t)}
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
