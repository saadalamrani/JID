import { fetchMentors } from '@/lib/queries/mentors'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { DEFAULT_MENTOR_FILTERS } from '@/types/mentor'
import { MentorsPageClient } from './_components/mentors-page-client'

type MentorsPageProps = {
  params: { locale: string }
}

export default async function MentorsPage({ params }: MentorsPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const initialData = await fetchMentors(DEFAULT_MENTOR_FILTERS)

  return (
    <main dir={dir} className="container-jid py-8" lang={locale}>
      <MentorsPageClient initialData={initialData} />
    </main>
  )
}
