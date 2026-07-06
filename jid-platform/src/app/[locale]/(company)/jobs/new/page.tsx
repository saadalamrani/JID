import { JobPostingWizard } from './_components/job-posting-wizard'
import { requireApprovedCompanyPoster } from '@/lib/jobs/company-access'

export default async function NewJobPage() {
  const poster = await requireApprovedCompanyPoster()

  return <JobPostingWizard poster={poster} />
}
