import { getTranslations } from 'next-intl/server'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { loadCareerOperationsBoard } from '@/lib/career-operations/service'
import { fetchUserApplications } from '@/lib/queries/radar'
import { fetchUpcomingMeetings } from '@/lib/queries/timeline'
import { RadarOperationsBoard } from '@/components/radar/radar-operations-board'

export default async function RadarPage() {
  const userId = await requireAuthenticatedUser()
  const t = await getTranslations('radar')
  const [board, applicationsResult, meetingsResult] = await Promise.all([
    loadCareerOperationsBoard(userId),
    fetchUserApplications(userId),
    fetchUpcomingMeetings(userId),
  ])

  return (
    <main className="container-jid py-8">
      <h1 className="sr-only">{t('title')}</h1>
      <RadarOperationsBoard
        userId={userId}
        board={board}
        applications={applicationsResult.applications}
        meetings={meetingsResult.meetings}
      />
    </main>
  )
}

export async function generateMetadata() {
  const t = await getTranslations('radar')
  return { title: t('title') }
}
