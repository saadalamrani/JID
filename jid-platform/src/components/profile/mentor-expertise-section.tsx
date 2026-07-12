'use client'

import { useTranslations } from 'next-intl'

type MentorExpertiseSectionProps = {
  /** Ranked declared tags — no percentages or pseudo-metrics (Task 4). */
  declaredSpecializations: string[]
  yearsExperience: number | null
}

export function MentorExpertiseSection({
  declaredSpecializations,
  yearsExperience,
}: MentorExpertiseSectionProps) {
  const t = useTranslations('profile.mentor.public')

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">{t('expertiseTitle')}</h2>

      <dl className="space-y-4">
        {yearsExperience != null ? (
          <div>
            <dt className="text-xs text-muted-foreground">{t('yearsExperienceLabel')}</dt>
            <dd className="mt-1 text-sm font-medium tabular-nums text-foreground">
              {t('yearsExperienceValue', { years: yearsExperience })}
            </dd>
          </div>
        ) : null}

        <div>
          <dt className="text-xs text-muted-foreground">{t('specializationsLabel')}</dt>
          <dd className="mt-2">
            {declaredSpecializations.length > 0 ? (
              <ul className="flex flex-wrap gap-2" role="list">
                {declaredSpecializations.map((tag) => (
                  <li key={tag}>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {tag}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t('specializationsEmpty')}</p>
            )}
          </dd>
        </div>
      </dl>
    </section>
  )
}
