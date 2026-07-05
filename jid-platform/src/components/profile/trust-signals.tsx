'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { BadgeDisplay, BadgeDisplayStatic } from '@/components/profile/badge-display'
import {
  OwnerStatsGrid,
  resolveOwnerStats,
  type OwnerStatsData,
} from '@/components/profile/owner-stats-grid'
import type { EarnedUserBadge } from '@/lib/profile/types'

export type TrustSignalsProps = {
  badges: EarnedUserBadge[]
  badgesLoading?: boolean
  locale?: 'ar' | 'en'
  /**
   * Owner-only stats gate (Section 13). Must be `false` for every non-owner viewer.
   * Stats never render when this is not strictly `true`.
   */
  showStats: boolean
  stats?: OwnerStatsData
  /** Async badge slot — wrapped in Suspense via BadgeDisplay. */
  badgeSlot?: ReactNode
}

export function TrustSignals({
  badges,
  badgesLoading = false,
  locale = 'ar',
  showStats,
  stats,
  badgeSlot,
}: TrustSignalsProps) {
  const t = useTranslations('profile.components')
  const ownerStats = resolveOwnerStats(showStats, stats)

  return (
    <section className="space-y-4" aria-label={t('trustSignals')}>
      <div>
        <h2 className="mb-2 text-sm font-medium text-jid-ink/70">{t('badgesTitle')}</h2>
        {badgeSlot ? (
          <BadgeDisplay>{badgeSlot}</BadgeDisplay>
        ) : (
          <BadgeDisplayStatic badges={badges} locale={locale} loading={badgesLoading} />
        )}
      </div>

      {ownerStats ? <OwnerStatsGrid stats={ownerStats} /> : null}
    </section>
  )
}
