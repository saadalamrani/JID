import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchUserRadarMeetings } from '@/lib/meetings/queries'
import { getTranslations } from 'next-intl/server'
import { RadarFeed } from './_components/radar-feed'

export default async function RadarPage() {
  const userId = await requireAuthenticatedUser()
  const items = await fetchUserRadarMeetings(userId)
  const t = await getTranslations('radar')

  return (
    <main className="container-jid py-8">
      <header className="mb-6">
        <h1 className="font-arabic text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-1 font-arabic text-sm text-jid-ink/60">{t('subtitle')}</p>
      </header>
      <RadarFeed items={items} />
    </main>
  )
}

export async function generateMetadata() {
  return { title: 'Radar' }
}
