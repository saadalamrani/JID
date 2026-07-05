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
          <div className="rounded-xl border border-jid-line bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-jid-olive">
              <Star className="h-5 w-5" aria-hidden />
              <h2 className="text-sm font-medium text-jid-ink/70">{t('ratingAvgLabel')}</h2>
            </div>
            <p className="mt-2 text-2xl font-semibold text-jid-ink">
              {ratingAvg != null ? t('ratingAvgValue', { rating: ratingAvg.toFixed(1) }) : t('metricUnavailable')}
            </p>
          </div>
          <div className="rounded-xl border border-jid-line bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-jid-olive">
              <Users className="h-5 w-5" aria-hidden />
              <h2 className="text-sm font-medium text-jid-ink/70">{t('sessionsCountLabel')}</h2>
            </div>
            <p className="mt-2 text-2xl font-semibold text-jid-ink">
              {t('sessionsCountValue', { count: sessionsCount })}
            </p>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-jid-line bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-jid-ink/70">{t('badgesTitle')}</h2>
        <BadgeDisplayStatic badges={badges} />
      </div>
    </section>
  )
}
