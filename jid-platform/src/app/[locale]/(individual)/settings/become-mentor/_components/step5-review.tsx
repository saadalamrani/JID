'use client'

import { useLocale, useTranslations } from 'next-intl'
import { MentorExpertiseSection } from '@/components/profile/mentor-expertise-section'
import { MentorIdentityHeader } from '@/components/profile/mentor-identity-header'
import {
  MENTOR_LANGUAGE_OPTIONS,
  MENTOR_MEDIUM_OPTIONS,
} from '@/lib/mentor-application/constants'
import type { BecomeMentorInput } from '@/lib/validations/become-mentor'

type Step5ReviewProps = {
  draft: BecomeMentorInput
  fullName: string
  avatarUrl?: string | null
}

export function Step5Review({ draft, fullName, avatarUrl }: Step5ReviewProps) {
  const t = useTranslations('mentorship.becomeMentor.step5')
  const locale = useLocale()
  const isEn = locale === 'en'

  const languageLabels = draft.languages
    .map((value) => {
      const option = MENTOR_LANGUAGE_OPTIONS.find((item) => item.value === value)
      if (!option) return value
      return isEn ? option.labelEn : option.labelAr
    })
    .join(isEn ? ', ' : '، ')

  const mediumLabels = draft.preferred_mediums
    .map((value) => {
      const option = MENTOR_MEDIUM_OPTIONS.find((item) => item.value === value)
      if (!option) return value
      return isEn ? option.labelEn : option.labelAr
    })
    .join(isEn ? ', ' : '، ')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-arabic text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="space-y-4" aria-live="polite">
        <MentorIdentityHeader
          isOwner={false}
          fullName={fullName}
          headline={draft.headline}
          bioSnippet={draft.bio_long}
          avatarUrl={avatarUrl}
          status={t('previewStatus')}
        />

        <MentorExpertiseSection
          sectors={draft.expertise_areas}
          yearsExperience={draft.years_experience}
        />

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 font-arabic text-sm font-medium text-muted-foreground">{t('detailsTitle')}</h3>
          <dl className="space-y-3 font-arabic text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">{t('currentRole')}</dt>
              <dd className="mt-1 text-foreground">
                {draft.current_job_title}
                {draft.current_company ? ` — ${draft.current_company}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('languages')}</dt>
              <dd className="mt-1 text-foreground">{languageLabels || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('mediums')}</dt>
              <dd className="mt-1 text-foreground">{mediumLabels || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('linkedin')}</dt>
              <dd className="mt-1 break-all text-primary">{draft.linkedin_url || '—'}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}
