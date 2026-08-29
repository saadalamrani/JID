import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { listOpportunityDiscovery } from '@/lib/opportunity/discovery'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { dbOfflineHint, isDbOfflineError } from '@/lib/supabase/offline-error'
import type { JobsListResult } from '@/types/job'
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

const EMPTY_JOBS: JobsListResult = { jobs: [], count: 0, page: 1, limit: 50 }
const EMPTY_LAMMAH: LammahPageState = {
  entitled: false,
  available: false,
  data: { items: [], count: 0 },
}

export default async function OpportunitiesPage({ params, searchParams }: OpportunitiesPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'

  let initialData = EMPTY_JOBS
  let initialLammahState = EMPTY_LAMMAH
  let setupHint: string | undefined
  try {
    const discovery = await listOpportunityDiscovery({ includeExternal: true })
    initialData = discovery.nativeJobsResult ?? EMPTY_JOBS
    initialLammahState = discovery.externalLammahState ?? EMPTY_LAMMAH
  } catch (error) {
    if (isDbOfflineError(error)) {
      setupHint = dbOfflineHint(locale)
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
