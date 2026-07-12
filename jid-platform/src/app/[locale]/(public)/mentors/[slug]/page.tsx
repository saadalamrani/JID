import { notFound } from 'next/navigation'
import { fetchMentorPublicByIdentifier } from '@/lib/queries/mentors'
import { fetchMentorResponseStats } from '@/lib/mentor/response-stats'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { MentorPublicDetailView } from '../_components/mentor-public-detail-view'

type MentorSlugPageProps = {
  params: { locale: string; slug: string }
}

export default async function MentorSlugPage({ params }: MentorSlugPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const mentor = await fetchMentorPublicByIdentifier(params.slug)

  if (!mentor) {
    notFound()
  }

  const responseStats = await fetchMentorResponseStats(mentor.user_id)

  return (
    <main dir={dir} className="container-jid py-8" lang={locale}>
      <MentorPublicDetailView mentor={mentor} locale={locale === 'en' ? 'en' : 'ar'} responseStats={responseStats} />
    </main>
  )
}

export async function generateMetadata({ params }: MentorSlugPageProps) {
  const mentor = await fetchMentorPublicByIdentifier(params.slug)
  if (!mentor) {
    return { title: 'Mentor' }
  }
  return {
    title: mentor.full_name ?? 'Mentor',
    description: mentor.headline ?? mentor.bio_short ?? undefined,
  }
}
