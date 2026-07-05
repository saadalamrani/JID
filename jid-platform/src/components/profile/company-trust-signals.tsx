'use client'

import { useLocale, useTranslations } from 'next-intl'
import { BadgePill } from '@/components/profile/badge-pill'
import { ProfileCompletionBar } from '@/components/profile/profile-completion-bar'
import type { EarnedEntityBadge } from '@/lib/profile/types'

type CompanyTrustSignalsProps = {
  badges: EarnedEntityBadge[]
  /** This company's own commitment score only — never compare across companies (Section 13). */
  commitmentScore: number
  showCommitmentScore: boolean
  isOnHonorRoll: boolean
}

/**
 * Public trust signals for a single company profile (Section 6.8).
 * Receives pre-fetched data for one company id — does not query other companies.
 */
export function CompanyTrustSignals({
  badges,
  commitmentScore,
  showCommitmentScore,
  isOnHonorRoll,
}: CompanyTrustSignalsProps) {
  const t = useTranslations('profile.company.public')
  const locale = useLocale() as 'ar' | 'en'

  return (
    <section className="space-y-4" aria-label={t('trustSignalsLabel')}>
      {showCommitmentScore ? (
        <div className="rounded-xl border border-jid-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-jid-ink/70">{t('commitmentScoreTitle')}</h2>
            <span className="text-sm font-medium text-jid-olive">
              {Math.round(commitmentScore)}%
            </span>
          </div>
          <p className="mt-1 text-xs text-jid-ink/50">{t('commitmentScoreHint')}</p>
          <ProfileCompletionBar percent={commitmentScore} showLabel={false} className="mt-3" />
        </div>
      ) : null}

      <div className="rounded-xl border border-jid-line bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-jid-ink/70">{t('badgesTitle')}</h2>
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
          <p className="text-sm text-jid-ink/50">{t('badgesEmpty')}</p>
        )}
      </div>
    </section>
  )
}
