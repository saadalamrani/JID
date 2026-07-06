import { notFound } from 'next/navigation'
import { TriageAccessError } from '@/lib/applications/triage-access'
import { fetchJobApplicantsForTriage } from '@/lib/applications/triage-queries'
import { ApplicantTriagePageClient } from './_components/applicant-triage-page-client'

type PageProps = {
  params: Promise<{ jobId: string }>
}

export default async function JobApplicantsPage({ params }: PageProps) {
  const { jobId } = await params

  try {
    const initialData = await fetchJobApplicantsForTriage(jobId, 'all')
    return <ApplicantTriagePageClient jobId={jobId} initialData={initialData} />
  } catch (error) {
    if (error instanceof TriageAccessError) {
      if (error.status === 404) notFound()
      notFound()
    }
    throw error
  }
}
