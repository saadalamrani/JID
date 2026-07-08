'use client'

import { Briefcase, MapPin, Users, Wifi } from 'lucide-react'
import { Link as LocaleLink } from '@/lib/i18n/navigation'
import { formatNumber } from '@/lib/utils/format'
import type { JobCardData } from '@/types/job'
import { EXPERIENCE_LEVEL_LABELS } from '@/types/job'
import { cn } from '@/lib/utils'
import { CompanyLogo } from '@/app/[locale]/(public)/catalog/_components/company-logo'
import { OwnershipBadge } from '@/app/[locale]/(public)/catalog/_components/ownership-badge'
import { DeadlineBar } from './deadline-bar'
import { JidPartnerBadge } from './jid-partner-badge'
import { JobActionButton } from './job-action-button'
import { JobSaveButton } from './job-save-button'
import { Pill } from './pill'

type JobCardProps = {
  job: JobCardData
  locale?: 'ar' | 'en'
  className?: string
  /** Section 6.4 — wizard preview: no navigation overlay, static CTA. */
  previewMode?: boolean
}

export function JobCard({ job, locale = 'ar', className, previewMode = false }: JobCardProps) {
  const title = job.title_ar || job.title_en || '—'
  const companyName = job.company.name_ar || job.company.name_en
  const sectorLabel = job.sector?.name_ar ?? job.sector?.name_en
  const regionLabel = job.region?.name_ar ?? job.region?.name_en
  const locationLabel = job.is_remote
    ? 'عن بُعد'
    : job.city ?? regionLabel ?? null
  const detailHref = `/opportunities/${job.slug ?? job.id}`
  const experienceLabel = EXPERIENCE_LEVEL_LABELS[job.experience_level]

  return (
    <article
      role="listitem"
      className={cn(
        'relative flex min-h-[300px] flex-col rounded-xl border border-border/40 bg-card p-4 shadow-sm',
        !previewMode && 'transition-shadow hover:shadow-md',
        className,
      )}
    >
      {!previewMode ? (
        <LocaleLink
          href={detailHref}
          className={cn(
            'absolute inset-0 z-10 rounded-xl',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          )}
          aria-label={`عرض تفاصيل ${title}`}
        />
      ) : null}

      {!previewMode ? (
        <div className="absolute end-3 top-3 z-30">
          <JobSaveButton jobId={job.id} />
        </div>
      ) : null}

      <header className="relative z-20 flex items-start gap-3 pointer-events-none">
        <CompanyLogo name={companyName} logoUrl={job.company.logo_url} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-arabic text-sm font-medium text-muted-foreground">{companyName}</p>
          <h2 className="mt-0.5 line-clamp-2 font-arabic text-base font-semibold text-foreground">
            {title}
          </h2>
        </div>
        {job.company.ownership_type ? (
          <OwnershipBadge type={job.company.ownership_type} />
        ) : null}
      </header>

      <div className="relative z-20 mt-3 flex flex-wrap items-center gap-1.5 pointer-events-none">
        <Pill icon={Briefcase}>{experienceLabel}</Pill>
        {locationLabel ? <Pill icon={job.is_remote ? Wifi : MapPin}>{locationLabel}</Pill> : null}
        {sectorLabel ? <Pill>{sectorLabel}</Pill> : null}
        {job.hasJidPartnerBadge ? <JidPartnerBadge /> : null}
      </div>

      <div className="relative z-20 mt-3 pointer-events-none">
        <DeadlineBar
          daysLeft={job.deadlineDaysLeft}
          applicationDeadline={job.application_deadline}
        />
      </div>

      <p className="relative z-20 mt-2 flex items-center gap-1 font-arabic text-xs text-foreground-400 pointer-events-none">
        <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          {formatNumber(job.applicant_count, locale)} متقدّم
        </span>
      </p>

      <div className={cn('relative z-30 mt-auto pt-4', previewMode ? 'pointer-events-none' : 'pointer-events-auto')}>
        {previewMode ? (
          <span
            className={cn(
              'inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5',
              'font-arabic text-sm font-medium',
              'bg-border/30 text-muted-foreground',
            )}
            aria-hidden
          >
            التقديم على موقع الجهة
          </span>
        ) : (
          <JobActionButton
            jobId={job.id}
            jobTitle={title}
            companyName={companyName}
            applyUrl={job.applyUrl}
          />
        )}
      </div>
    </article>
  )
}
