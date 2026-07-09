import { notFound } from 'next/navigation'
import { companyHasSmartCommunication } from '@/lib/communication/server'
import { TriageAccessError } from '@/lib/applications/triage-access'
import { assertJobTriageAccess } from '@/lib/applications/triage-access'
import { fetchJobApplicantsForTriage } from '@/lib/applications/triage-queries'
import {
  fetchCompanyBoostUsage,
  fetchJobBoostPerformance,
  fetchJobBoostState,
} from '@/lib/priority-visibility/queries'
import { ApplicantTriagePageClient } from './_components/applicant-triage-page-client'

type PageProps = {
  params: Promise<{ jobId: string }>
}

export default async function JobApplicantsPage({ params }: PageProps) {
  const { jobId } = await params

  try {
    const { job } = await assertJobTriageAccess(jobId)
    const [initialData, smartCommunicationEnabled, boostState, boostUsage, boostPerformance] =
      await Promise.all([
        fetchJobApplicantsForTriage(jobId, 'all'),
        companyHasSmartCommunication(job.company_id),
        fetchJobBoostState(jobId),
        fetchCompanyBoostUsage(job.company_id),
        fetchJobBoostPerformance(jobId),
      ])

    return (
      <ApplicantTriagePageClient
        jobId={jobId}
        companyId={job.company_id}
        initialData={initialData}
        smartCommunicationEnabled={smartCommunicationEnabled}
        boostState={boostState}
        boostUsage={boostUsage}
        boostPerformance={boostPerformance}
      />
    )
  } catch (error) {
    if (error instanceof TriageAccessError) {
      if (error.status === 404) notFound()
      notFound()
    }
    throw error
  }
}
