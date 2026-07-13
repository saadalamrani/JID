import { fetchMentors } from '@/lib/queries/mentors'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { dbOfflineHint, isDbOfflineError } from '@/lib/supabase/offline-error'
import { DEFAULT_MENTOR_FILTERS, type MentorsListResult } from '@/types/mentor'
import { MentorsPageClient } from './_components/mentors-page-client'

type MentorsPageProps = {
  params: { locale: string }
}

export default async function MentorsPage({ params }: MentorsPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'

  const emptyData: MentorsListResult = {
    mentors: [],
    count: 0,
    stats: { activeMentorCount: 0, totalSessionsCount: 0 },
  }

  let initialData = emptyData
  let setupHint: string | undefined

  try {
    initialData = await fetchMentors(DEFAULT_MENTOR_FILTERS)
  } catch (error) {
    if (isDbOfflineError(error)) {
      setupHint = dbOfflineHint(locale)
    } else {
      throw error
    }
  }

  return (
    <main dir={dir} className="container-jid py-8" lang={locale}>
      <MentorsPageClient initialData={initialData} setupHint={setupHint} />
    </main>
  )
}
