'use client'

import { useTranslations } from 'next-intl'
import { AlertTriangle, Clock } from 'lucide-react'
import { SlaProgressBar } from '@/components/entity/sla-progress-bar'
import { OrgOutcomePanel } from '@/components/entity/org-outcome-panel'
import { SLA_HOURS } from '@/lib/entity/constants'
import { hoursSince, slaProgressPercent } from '@/lib/entity/claims'

export type PendingClaimView = {
  id: string
  company_name: string
  business_email: string
  claimant_name: string
  status: string
  created_at: string
}

type PendingReviewViewProps = {
  claim: PendingClaimView
}

export function PendingReviewView({ claim }: PendingReviewViewProps) {
  const t = useTranslations('entity.pendingReview')
  const elapsed = hoursSince(claim.created_at)
  const overdue = elapsed > SLA_HOURS
  const progress = slaProgressPercent(claim.created_at, SLA_HOURS)
  const remainingHours = Math.max(0, SLA_HOURS - elapsed)

  return (
    <OrgOutcomePanel tone={overdue ? 'rejected' : 'pending'} testId="pending-review-panel">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-jid-beige text-primary">
          <Clock className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {claim.status === 'needs_more_info' ? t('needsMoreInfoTitle') : t('title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {claim.status === 'needs_more_info' ? t('needsMoreInfoSubtitle') : t('subtitle')}
          </p>
        </div>
      </div>

      {claim.status === 'needs_more_info' ? (
        <p
          data-testid="awaiting-more-information"
          className="mb-6 rounded-md border border-border bg-jid-beige/60 p-3 text-sm text-foreground"
        >
          {t('needsMoreInfoBody')}
        </p>
      ) : null}

      <div className="mb-6 space-y-2 rounded-md border border-border bg-jid-beige/40 p-4 text-sm">
        <p>
          <span className="text-muted-foreground">{t('company')}:</span>{' '}
          <span className="font-medium text-foreground">{claim.company_name}</span>
        </p>
        <p>
          <span className="text-muted-foreground">{t('submittedBy')}:</span>{' '}
          <span className="font-medium text-foreground">{claim.claimant_name}</span>
        </p>
        <p dir="ltr" className="text-start">
          <span className="text-muted-foreground">{t('businessEmail')}:</span>{' '}
          <span className="font-medium text-foreground">{claim.business_email}</span>
        </p>
      </div>

      <SlaProgressBar
        percent={progress}
        overdue={overdue}
        label={t('slaLabel', { hours: SLA_HOURS })}
      />

      <p className="mt-3 text-sm text-muted-foreground">
        {overdue
          ? t('overdueMessage')
          : t('remainingMessage', { hours: remainingHours.toFixed(1) })}
      </p>

      {overdue ? (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{t('overdueAlert')}</p>
        </div>
      ) : null}

      <p className="mt-6 text-xs text-muted-foreground">{t('staffNote')}</p>
    </OrgOutcomePanel>
  )
}
