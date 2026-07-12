'use client'

import { useTranslations } from 'next-intl'
import { BadgePill } from '@/components/profile/badge-pill'
import type { EarnedUserBadge } from '@/lib/profile/types'

type ProfileAchievementsSectionProps = {
  badges: EarnedUserBadge[]
  locale: 'ar' | 'en'
  visible: boolean
  isOwner: boolean
}

export function ProfileAchievementsSection({
  badges,
  locale,
  visible,
  isOwner,
}: ProfileAchievementsSectionProps) {
  const t = useTranslations('profile.workspace.achievements')

  if (!visible) return null

  if (badges.length === 0) {
    if (!isOwner) return null
    return (
      <section id="profile-section-achievements" className="scroll-mt-24">
        <h2 className="mb-3 text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          {t('emptyOwner')}
        </p>
      </section>
    )
  }

  return (
    <section id="profile-section-achievements" className="scroll-mt-24">
      <h2 className="mb-3 text-lg font-semibold text-foreground">{t('title')}</h2>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <div key={badge.slug} className="flex flex-col gap-1">
            <BadgePill badge={badge} locale={locale} />
            {badge.awarded_at ? (
              <a
                href="#profile-section-timeline"
                className="text-xs text-primary hover:underline"
              >
                {t('viewOnTimeline')}
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
