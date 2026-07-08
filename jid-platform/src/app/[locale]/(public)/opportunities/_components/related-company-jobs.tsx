import { Link as LocaleLink } from '@/lib/i18n/navigation'
import type { JobCardData } from '@/types/job'
import { EXPERIENCE_LEVEL_LABELS } from '@/types/job'
import { DeadlineBar } from './deadline-bar'

type RelatedCompanyJobsProps = {
  jobs: JobCardData[]
}

export function RelatedCompanyJobs({ jobs }: RelatedCompanyJobsProps) {
  if (jobs.length === 0) return null

  return (
    <section className="mt-10 border-t border-border/30 pt-8" aria-label="فرص أخرى من نفس الجهة">
      <h2 className="font-arabic text-lg font-semibold text-foreground">فرص أخرى من نفس الجهة</h2>
      <ul className="mt-4 space-y-3">
        {jobs.map((job) => {
          const title = job.title_ar || job.title_en || '—'
          const href = `/opportunities/${job.slug ?? job.id}`
          const experienceLabel = EXPERIENCE_LEVEL_LABELS[job.experience_level]

          return (
            <li key={job.id}>
              <LocaleLink
                href={href}
                className="block rounded-xl border border-border/40 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-arabic text-base font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 font-arabic text-xs text-muted-foreground">{experienceLabel}</p>
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
