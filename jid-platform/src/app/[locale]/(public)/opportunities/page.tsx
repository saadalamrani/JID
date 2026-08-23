import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { fetchJobs } from '@/lib/queries/jobs'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { dbOfflineHint, isDbOfflineError } from '@/lib/supabase/offline-error'
import { DEFAULT_JOB_FILTERS, type JobsListResult } from '@/types/job'
import { fetchLammahPageState } from '@/lib/lammah/server'
import type { LammahPageState } from '@/types/lammah'
import { JobBoardPageClient } from './_components/job-board-page-client'

type OpportunitiesPageProps = {
  params: { locale: string }
  searchParams?: { tab?: string }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('opportunities.meta')
  return {
    title: t('title'),
  }
}

export default async function OpportunitiesPage({ params, searchParams }: OpportunitiesPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'

  const emptyData: JobsListResult = { jobs: [], count: 0, page: 1, limit: 50 }
  let initialData = emptyData
  let initialLammahState: LammahPageState = {
    entitled: false,
    available: false,
    data: { items: [], count: 0 },
  }
  let setupHint: string | undefined

  try {
    initialData = await fetchJobs({
      ...DEFAULT_JOB_FILTERS,
      limit: 50,
      page: 1,
    })
  } catch (error) {
    if (isDbOfflineError(error)) {
      setupHint = dbOfflineHint(locale)
    } else {
      throw error
    }
  }

  try {
    initialLammahState = await fetchLammahPageState()
  } catch (error) {
    if (isDbOfflineError(error)) {
      setupHint ??= dbOfflineHint(locale)
    } else {
      throw error
    }
  }

  return (
    <main dir={dir} className="container-jid py-8" lang={locale}>
      <JobBoardPageClient
        initialData={initialData}
        initialLammahState={initialLammahState}
        initialTab={searchParams?.tab === 'lammah' ? 'lammah' : 'native'}
        setupHint={setupHint}
      />
    </main>
  )
}
