import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { TriageAccessError, assertJobTriageAccess } from '@/lib/applications/triage-access'
import { fetchJobApplicantsForTriage } from '@/lib/applications/triage-queries'
import {
  companyHasSsis,
  fetchJobScreening,
  fetchScreeningResults,
} from '@/lib/ssis/queries'
import { ScreeningPageClient } from './_components/screening-page-client'

type PageProps = {
  params: Promise<{ jobId: string; locale: string }>
}

export default async function JobScreeningPage({ params }: PageProps) {
  const { jobId } = await params
  const t = await getTranslations('company.ssis')

  try {
    const { job } = await assertJobTriageAccess(jobId)
    const [screening, ssisEnabled, applicantsData] = await Promise.all([
      fetchJobScreening(jobId),
      companyHasSsis(job.company_id),
      fetchJobApplicantsForTriage(jobId, 'all'),
    ])

    const results = screening ? await fetchScreeningResults(screening.id) : []
    const applicants = applicantsData.applications.map((app) => ({
      id: app.id,
      label: app.contact_email ?? app.applicant_id.slice(0, 8),
      status: app.status,
    }))

    return (
      <main className="container-jid py-8">
        <header className="mb-6">
          <Link
            href={`/jobs/${jobId}/applicants`}
            className="font-arabic text-sm text-muted-foreground hover:text-foreground"
          >
            ← {t('backToApplicants')}
          </Link>
          <h1 className="mt-2 font-arabic text-2xl font-semibold text-foreground">{t('pageTitle')}</h1>
          <p className="mt-1 font-arabic text-sm text-muted-foreground">
            {job.title_ar}
            {job.title_en ? ` · ${job.title_en}` : ''}
          </p>
        </header>

        <ScreeningPageClient
          jobId={jobId}
          screening={screening}
          results={results}
          applicants={applicants}
          ssisEnabled={ssisEnabled}
        />
      </main>
    )
  } catch (error) {
    if (error instanceof TriageAccessError) {
      if (error.status === 404) notFound()
      notFound()
    }
    throw error
  }
}

export async function generateMetadata() {
  return { title: 'Smart Screening' }
}
