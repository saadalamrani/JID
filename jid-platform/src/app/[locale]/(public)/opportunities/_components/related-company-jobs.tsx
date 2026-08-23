'use client'

import { useTranslations } from 'next-intl'
import { Link as LocaleLink } from '@/lib/i18n/navigation'
import type { JobCardData } from '@/types/job'
import { DeadlineBar } from './deadline-bar'

type RelatedCompanyJobsProps = {
  jobs: JobCardData[]
}

export function RelatedCompanyJobs({ jobs }: RelatedCompanyJobsProps) {
  const t = useTranslations('opportunities.detail')
  const tFilters = useTranslations('filters')

  if (jobs.length === 0) return null

  return (
    <section className="mt-10 border-t border-border/30 pt-8" aria-label={t('relatedJobsHeading')}>
      <h2 className="text-lg font-semibold text-foreground">{t('relatedJobsHeading')}</h2>
      <ul className="mt-4 space-y-3">
        {jobs.map((job) => {
          const title = job.title_ar || job.title_en || '—'
          const href = `/opportunities/${job.slug ?? job.id}`
          const experienceLabel = tFilters(`experienceLevel.${job.experience_level}`)

          return (
            <li key={job.id}>
              <LocaleLink
                href={href}
                className="block rounded-xl border border-border/40 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{experienceLabel}</p>
                  </div>
                  <DeadlineBar
                    daysLeft={job.deadlineDaysLeft}
                    applicationDeadline={job.application_deadline}
                  />
                </div>
              </LocaleLink>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
