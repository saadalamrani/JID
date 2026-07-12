import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import { getTranslations } from 'next-intl/server'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchUserApplications } from '@/lib/queries/radar'
import { radarApplicationsQueryKey } from '@/lib/queries/radar-query-keys'
import { fetchUpcomingMeetings } from '@/lib/queries/timeline'
import { timelineMeetingsQueryKey } from '@/lib/queries/timeline-query-keys'
import { RadarPageShell } from './_components/radar-page-shell'

export default async function RadarPage() {
  const userId = await requireAuthenticatedUser()
  const t = await getTranslations('radar')
  const queryClient = new QueryClient()

  const [applicationsResult, meetingsResult] = await Promise.all([
    fetchUserApplications(userId),
    fetchUpcomingMeetings(userId),
  ])

  queryClient.setQueryData(radarApplicationsQueryKey(userId), applicationsResult)
  queryClient.setQueryData(timelineMeetingsQueryKey(userId), meetingsResult)

  return (
    <main className="container-jid py-8">
      <header className="mb-6">
        <h1 className="font-arabic text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <RadarPageShell userId={userId} />
      </HydrationBoundary>
    </main>
  )
}

export async function generateMetadata() {
  return { title: 'Radar' }
}
