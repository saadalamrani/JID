'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { BadgeDisplay, BadgeDisplayStatic } from '@/components/profile/badge-display'
import { OwnerViewStats } from '@/components/profile/owner-view-stats'
import type { EarnedUserBadge } from '@/lib/profile/types'

export type TrustSignalsProps = {
  badges: EarnedUserBadge[]
  badgesLoading?: boolean
  locale?: 'ar' | 'en'
  /** Owner-only stats gate (Section 13). */
  showStats: boolean
  profileId?: string | null
  completionPct?: number
  badgeSlot?: ReactNode
}

export function TrustSignals({
  badges,
  badgesLoading = false,
  locale = 'ar',
  showStats,
  profileId,
  completionPct = 0,
  badgeSlot,
}: TrustSignalsProps) {
  const t = useTranslations('profile.components')

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

      {showStats && profileId ? (
        <OwnerViewStats profileId={profileId} completionPct={completionPct} />
      ) : null}
    </section>
  )
}
