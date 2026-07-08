'use client'

import { useTranslations } from 'next-intl'

type MentorExpertiseSectionProps = {
  sectors: string[]
  yearsExperience: number | null
}

export function MentorExpertiseSection({ sectors, yearsExperience }: MentorExpertiseSectionProps) {
  const t = useTranslations('profile.mentor.public')

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">{t('expertiseTitle')}</h2>

      <dl className="space-y-4">
        {yearsExperience != null ? (
          <div>
            <dt className="text-xs text-muted-foreground">{t('yearsExperienceLabel')}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {t('yearsExperienceValue', { years: yearsExperience })}
            </dd>
          </div>
        ) : null}

        <div>
          <dt className="text-xs text-muted-foreground">{t('sectorsLabel')}</dt>
          <dd className="mt-2">
            {sectors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sectors.map((sector) => (
                  <span
                    key={sector}
                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {sector}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('sectorsEmpty')}</p>
            )}
          </dd>
        </div>
      </dl>
    </section>
  )
}
