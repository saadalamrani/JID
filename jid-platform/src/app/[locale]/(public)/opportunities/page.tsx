import { fetchJobs } from '@/lib/queries/jobs'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { DEFAULT_JOB_FILTERS } from '@/types/job'
import { JobBoardPageClient } from './_components/job-board-page-client'

type OpportunitiesPageProps = {
  params: { locale: string }
}

export default async function OpportunitiesPage({ params }: OpportunitiesPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const initialData = await fetchJobs({
    ...DEFAULT_JOB_FILTERS,
    limit: 50,
    page: 1,
  })

  return (
    <main dir={dir} className="container-jid py-8" lang={locale}>
      <JobBoardPageClient initialData={initialData} />
    </main>
  )
}
