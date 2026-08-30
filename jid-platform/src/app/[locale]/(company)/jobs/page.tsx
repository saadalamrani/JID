import { Link } from '@/lib/i18n/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { requireApprovedCompanyPoster } from '@/lib/jobs/company-access'
import { fetchOwnerManagedJobs, type OwnerManagedJob } from '@/lib/queries/jobs'
import { formatNumber } from '@/lib/utils/format'
import { JOB_DB_STATUSES, type JobDbStatus } from '@/types/job'
import type { Locale } from '@/lib/i18n/config'

function jobTitle(job: OwnerManagedJob, locale: Locale): string {
  if (locale === 'en' && job.title_en?.trim()) return job.title_en.trim()
  return job.title_ar
}

function isJobDbStatus(value: string): value is JobDbStatus {
  return (JOB_DB_STATUSES as readonly string[]).includes(value)
}

export default async function CompanyJobsListPage() {
  await requireApprovedCompanyPoster()
  const [jobs, t, locale] = await Promise.all([
    fetchOwnerManagedJobs(100),
    getTranslations('company.jobsList'),
    getLocale(),
  ])
  const typedLocale = locale as Locale

  return (
    <section className="space-y-6" data-testid="company-jobs-list">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-foreground/70 text-sm">{t('subtitle')}</p>
        </div>
        <Link
          href="/jobs/new"
          className="hover:bg-primary/90 inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('postCta')}
        </Link>
      </header>

      {jobs.length === 0 ? (
        <div
          className="bg-background/60 rounded-2xl border border-dashed border-border px-6 py-12 text-center"
          data-testid="company-jobs-empty"
        >
          <p className="text-foreground/70 text-sm">{t('empty')}</p>
          <Link
            href="/jobs/new"
            className="hover:bg-primary/90 mt-4 inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {t('postCta')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="rounded-2xl border border-border bg-background p-4"
              data-testid="company-job-row"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 className="truncate text-base font-semibold text-foreground">
                    {jobTitle(job, typedLocale)}
                  </h2>
                  <p className="text-foreground/60 text-xs">
                    {t('applicants', { count: formatNumber(job.applicant_count, typedLocale) })}
                  </p>
                </div>
                <span
                  className="text-foreground/80 rounded-full border border-border px-2.5 py-1 text-xs font-medium"
                  data-testid="company-job-status"
                >
                  {isJobDbStatus(job.status) ? t(`status.${job.status}`) : job.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/jobs/${job.id}/applicants`}
                  className="hover:border-primary/40 inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t('viewApplicants')}
                </Link>
                <Link
                  href={`/jobs/${job.id}/sourcing`}
                  className="hover:border-primary/40 inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t('viewSourcing')}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
