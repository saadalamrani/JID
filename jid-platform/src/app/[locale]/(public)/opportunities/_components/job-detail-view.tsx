import type { Job, JobCardData } from '@/types/job'
import { EXPERIENCE_LEVEL_LABELS } from '@/types/job'
import type { JobDeclarationStatus } from '@/types/self-declaration'
import { CompanyLogo } from '@/app/[locale]/(public)/catalog/_components/company-logo'
import { OwnershipBadge } from '@/app/[locale]/(public)/catalog/_components/ownership-badge'
import { DeadlineBar } from './deadline-bar'
import { JobActionButton } from './job-action-button'
import { JobApplicantCount } from './job-applicant-count'
import { JobAutoReplyDisclaimer } from '@/components/communication/job-auto-reply-disclaimer'
import { Pill } from './pill'
import { RelatedCompanyJobs } from './related-company-jobs'
import { JobViewedTracker } from './job-viewed-tracker'

type JobDetailViewProps = {
  job: Job
  relatedJobs: JobCardData[]
  declarationStatus: JobDeclarationStatus
  locale: 'ar' | 'en'
  showSmartMatching?: boolean
  showApplicationAnalytics?: boolean
}

export function JobDetailView({
  job,
  relatedJobs,
  declarationStatus,
  locale,
  showSmartMatching = true,
  showApplicationAnalytics = true,
}: JobDetailViewProps) {
  const title = job.title_ar || job.title_en || '—'
  const companyName = job.company.name_ar || job.company.name_en
  const sectorLabel = job.sector?.name_ar ?? job.sector?.name_en
  const regionLabel = job.region?.name_ar ?? job.region?.name_en
  const experienceLabel = EXPERIENCE_LEVEL_LABELS[job.experience_level]

  return (
    <article className="space-y-8">
      <JobViewedTracker jobId={job.id} companyId={job.company_id} />
      <header className="space-y-6 rounded-xl border border-border/40 bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <CompanyLogo name={companyName} logoUrl={job.company.logo_url} />
          <div className="min-w-0 flex-1">
            <p className="font-arabic text-sm font-medium text-muted-foreground">{companyName}</p>
            <h1 className="mt-1 font-arabic text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {job.company.ownership_type ? (
                <OwnershipBadge type={job.company.ownership_type} />
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill>{experienceLabel}</Pill>
          {job.is_remote ? <Pill>عن بُعد</Pill> : null}
          {job.city ? <Pill>{job.city}</Pill> : null}
          {sectorLabel ? <Pill>{sectorLabel}</Pill> : null}
          {regionLabel ? <Pill>{regionLabel}</Pill> : null}
        </div>

        <DeadlineBar
          daysLeft={job.deadlineDaysLeft}
          applicationDeadline={job.application_deadline}
          size="large"
        />

        {showApplicationAnalytics ? (
          <JobApplicantCount
            jobId={job.id}
            initialCount={job.applicant_count}
            locale={locale}
          />
        ) : null}

        <JobActionButton
          jobId={job.id}
          jobTitle={title}
          companyName={companyName}
          applyUrl={job.applyUrl}
          initialDeclared={declarationStatus.declared}
          initialPrimaryEmail={declarationStatus.primaryEmail}
          className="max-w-md"
        />

        <JobAutoReplyDisclaimer jobId={job.id} className="max-w-md" />
      </header>

      {job.description_ar ? (
        <section className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
          <h2 className="font-arabic text-lg font-semibold text-foreground">وصف الفرصة</h2>
          <div className="mt-4 whitespace-pre-wrap font-arabic text-sm leading-7 text-foreground/85">
            {job.description_ar}
          </div>
        </section>
      ) : null}

      {job.required_skills.length > 0 ? (
        <section className="rounded-xl border border-border/40 bg-card p-6 shadow-sm">
          <h2 className="font-arabic text-lg font-semibold text-foreground">المهارات المطلوبة</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {job.required_skills.map((skill) => (
              <Pill key={skill}>{skill}</Pill>
            ))}
          </div>
        </section>
      ) : null}

      {showSmartMatching ? <RelatedCompanyJobs jobs={relatedJobs} /> : null}
    </article>
  )
}
