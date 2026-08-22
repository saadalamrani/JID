import { notFound } from 'next/navigation'
import { companyHasSmartCommunication } from '@/lib/communication/server'
import { TriageAccessError } from '@/lib/applications/triage-access'
import { assertJobTriageAccess } from '@/lib/applications/triage-access'
import { fetchJobApplicantsForTriage } from '@/lib/applications/triage-queries'
import { ApplicantTriagePageClient } from './_components/applicant-triage-page-client'

type PageProps = {
  params: Promise<{ jobId: string }>
}

export default async function JobApplicantsPage({ params }: PageProps) {
  const { jobId } = await params

  try {
    const { job } = await assertJobTriageAccess(jobId)
    if (!job.company_id) notFound()

    // Paid visibility (boost) data intentionally not fetched here — see rendering
    // note in ApplicantTriagePageClient (JID Design & UX Execution spec §10B).
    const [initialData, smartCommunicationEnabled] = await Promise.all([
      fetchJobApplicantsForTriage(jobId, 'all'),
      companyHasSmartCommunication(job.company_id),
    ])

    return (
      <ApplicantTriagePageClient
        jobId={jobId}
        companyId={job.company_id}
        initialData={initialData}
        smartCommunicationEnabled={smartCommunicationEnabled}
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
