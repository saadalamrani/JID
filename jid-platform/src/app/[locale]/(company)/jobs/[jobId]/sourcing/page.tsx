import { notFound } from 'next/navigation'
import { requireApprovedCompanyPoster } from '@/lib/jobs/company-access'
import { assertJobTriageAccess } from '@/lib/applications/triage-access'
import { TriageAccessError } from '@/lib/applications/triage-access'
import { ensureHiringRoleForJob } from '@/lib/talent-sourcing/service'
import { TalentSourcingClient } from './_components/talent-sourcing-client'

type PageProps = {
  params: Promise<{ jobId: string }>
}

export default async function JobTalentSourcingPage({ params }: PageProps) {
  const { jobId } = await params
  await requireApprovedCompanyPoster()

  try {
    await assertJobTriageAccess(jobId)
    await ensureHiringRoleForJob(jobId)
    return <TalentSourcingClient jobId={jobId} />
  } catch (error) {
    if (error instanceof TriageAccessError) notFound()
    throw error
  }
}
