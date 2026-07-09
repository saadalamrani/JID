'use client'

import { useLocale, useTranslations } from 'next-intl'
import { BadgePill } from '@/components/profile/badge-pill'
import type { EarnedEntityBadge } from '@/lib/profile/types'

type CompanyTrustSignalsProps = {
  badges: EarnedEntityBadge[]
  isOnHonorRoll: boolean
}

/**
 * Public trust signals for a single company profile (Section 6.8).
 * Receives pre-fetched data for one company id — does not query other companies.
 */
export function CompanyTrustSignals({ badges, isOnHonorRoll }: CompanyTrustSignalsProps) {
  const t = useTranslations('profile.company.public')
  const locale = useLocale() as 'ar' | 'en'

  return (
    <section className="space-y-4" aria-label={t('trustSignalsLabel')}>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">{t('badgesTitle')}</h2>
        {badges.length > 0 || isOnHonorRoll ? (
          <div className="flex flex-wrap gap-2">
            {isOnHonorRoll ? (
              <BadgePill
                badge={{
                  slug: 'honor_roll',
                  name_ar: t('honorRollBadgeAr'),
                  name_en: t('honorRollBadgeEn'),
                  icon_key: 'badge-honor',
                  description_ar: null,
                }}
                locale={locale}
              />
            ) : null}
            {badges.map((badge) => (
              <BadgePill key={badge.id} badge={badge} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('badgesEmpty')}</p>
        )}
      </div>
    </section>
  )
}
