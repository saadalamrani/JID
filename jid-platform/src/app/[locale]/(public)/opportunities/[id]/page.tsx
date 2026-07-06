import { notFound } from 'next/navigation'
import { getJobDeclarationStatus } from '@/lib/jobs/self-declaration-server'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { fetchJobDetailByRef, fetchRelatedCompanyJobs } from '@/lib/queries/jobs'
import { createClient } from '@/lib/supabase/server'
import type { JobDeclarationStatus } from '@/types/self-declaration'
import { JobDetailView } from '../_components/job-detail-view'
import { JobUnavailable } from '../_components/job-unavailable'

type JobDetailPageProps = {
  params: { locale: string; id: string }
}

async function resolveDeclarationStatus(jobId: string): Promise<JobDeclarationStatus> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { declared: false, saved: false, primaryEmail: null }
  }

  return getJobDeclarationStatus(supabase, user.id, jobId, user.email)
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const result = await fetchJobDetailByRef(params.id)

  if (result.kind === 'not_found') {
    notFound()
  }

  if (result.kind === 'unavailable') {
    return (
      <main dir={dir} className="container-jid py-8" lang={locale}>
        <JobUnavailable />
      </main>
    )
  }

  const { job } = result
  const [declarationStatus, relatedJobs] = await Promise.all([
    resolveDeclarationStatus(job.id),
    fetchRelatedCompanyJobs(job.company_id, job.id, 4),
  ])

  return (
    <main dir={dir} className="container-jid py-8" lang={locale}>
      <JobDetailView
        job={job}
        relatedJobs={relatedJobs}
        declarationStatus={declarationStatus}
        locale={locale}
      />
    </main>
  )
}

export async function generateMetadata({ params }: JobDetailPageProps) {
  const result = await fetchJobDetailByRef(params.id)

  if (result.kind !== 'ok') {
    return { title: 'فرصة وظيفية' }
  }

  const title = result.job.title_ar || result.job.title_en || 'فرصة وظيفية'
  const companyName =
    result.job.company.name_ar || result.job.company.name_en || ''

  return {
    title: companyName ? `${title} — ${companyName}` : title,
  }
}
