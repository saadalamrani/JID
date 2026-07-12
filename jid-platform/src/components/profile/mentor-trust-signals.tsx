'use client'

import { Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { BadgeDisplayStatic } from '@/components/profile/badge-display'
import type { EarnedUserBadge } from '@/lib/profile/types'

type MentorTrustSignalsProps = {
  badges: EarnedUserBadge[]
  ratingAvg: number | null
}

export function MentorTrustSignals({ badges, ratingAvg }: MentorTrustSignalsProps) {
  const t = useTranslations('profile.mentor.public')

  return (
    <section className="space-y-4" aria-label={t('trustSignalsLabel')}>
      {ratingAvg != null ? (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Star className="h-5 w-5" aria-hidden />
            <h2 className="text-sm font-medium text-muted-foreground">{t('ratingAvgLabel')}</h2>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
            {t('ratingAvgValue', { rating: ratingAvg.toFixed(1) })}
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">{t('badgesTitle')}</h2>
        <BadgeDisplayStatic badges={badges} />
      </div>
    </section>
  )
}
