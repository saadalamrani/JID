'use client'

import { useTranslations } from 'next-intl'
import { Clock } from 'lucide-react'
import { OrgOutcomePanel } from '@/components/entity/org-outcome-panel'

export type PendingClaimView = {
  id: string
  company_name: string
  business_email: string
  representative_name: string
  status: string
  created_at: string
}

type PendingReviewViewProps = {
  claim: PendingClaimView
}

export function PendingReviewView({ claim }: PendingReviewViewProps) {
  const t = useTranslations('entity.pendingReview')
  const isNeedsMoreInfo = claim.status === 'needs_more_info'

  return (
    <OrgOutcomePanel tone="pending" testId="pending-review-panel">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-jid-beige text-primary">
          <Clock className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {isNeedsMoreInfo ? t('needsMoreInfoTitle') : t('title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isNeedsMoreInfo ? t('needsMoreInfoSubtitle') : t('subtitle')}
          </p>
        </div>
      </div>

      {isNeedsMoreInfo ? (
        <p
          data-testid="awaiting-more-information"
          className="mb-6 rounded-md border border-border bg-jid-beige/60 p-3 text-sm text-foreground"
        >
          {t('needsMoreInfoBody')}
        </p>
      ) : null}

      <div className="mb-6 space-y-4 text-sm">
        <section>
          <h2 className="font-medium text-foreground">{t('whatHappened')}</h2>
          <p className="mt-1 text-muted-foreground">{t('whatHappenedBody')}</p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">{t('whatWeReview')}</h2>
          <p className="mt-1 text-muted-foreground">{t('whatWeReviewBody')}</p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">{t('whatYouCanDo')}</h2>
          <p className="mt-1 text-muted-foreground">{t('whatYouCanDoBody')}</p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">{t('whatNext')}</h2>
          <p className="mt-1 text-muted-foreground">{t('whatNextBody')}</p>
        </section>
      </div>

      <div className="mb-6 space-y-2 rounded-md border border-border bg-jid-beige/40 p-4 text-sm">
        <p>
          <span className="text-muted-foreground">{t('company')}:</span>{' '}
          <span className="font-medium text-foreground">{claim.company_name}</span>
        </p>
        <p>
          <span className="text-muted-foreground">{t('submittedBy')}:</span>{' '}
          <span className="font-medium text-foreground">{claim.representative_name}</span>
        </p>
        <p dir="ltr" className="text-start">
          <span className="text-muted-foreground">{t('businessEmail')}:</span>{' '}
          <span className="font-medium text-foreground">{claim.business_email}</span>
        </p>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">{t('staffNote')}</p>
    </OrgOutcomePanel>
  )
}
