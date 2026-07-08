'use client'

import { Star, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { BadgeDisplayStatic } from '@/components/profile/badge-display'
import type { EarnedUserBadge } from '@/lib/profile/types'

type MentorTrustSignalsProps = {
  badges: EarnedUserBadge[]
  ratingAvg: number | null
  sessionsCount: number
  /** Public session stats for this mentor only (Section 6.10). */
  showSessionStats: boolean
}

export function MentorTrustSignals({
  badges,
  ratingAvg,
  sessionsCount,
  showSessionStats,
}: MentorTrustSignalsProps) {
  const t = useTranslations('profile.mentor.public')

  return (
    <section className="space-y-4" aria-label={t('trustSignalsLabel')}>
      {showSessionStats ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
              <Star className="h-5 w-5" aria-hidden />
              <h2 className="text-sm font-medium text-muted-foreground">{t('ratingAvgLabel')}</h2>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {ratingAvg != null ? t('ratingAvgValue', { rating: ratingAvg.toFixed(1) }) : t('metricUnavailable')}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" aria-hidden />
              <h2 className="text-sm font-medium text-muted-foreground">{t('sessionsCountLabel')}</h2>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {t('sessionsCountValue', { count: sessionsCount })}
            </p>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">{t('badgesTitle')}</h2>
        <BadgeDisplayStatic badges={badges} />
      </div>
    </section>
  )
}
