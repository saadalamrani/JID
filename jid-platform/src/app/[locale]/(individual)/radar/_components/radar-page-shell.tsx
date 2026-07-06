'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { fetchUserApplicationsClient, userApplicationsQueryKey } from '@/lib/applications/client'
import { fetchUpcomingMeetingsClient } from '@/lib/timeline/client'
import { timelineMeetingsQueryKey } from '@/lib/queries/timeline'
import { useRealtimeApplications } from '@/lib/hooks/use-realtime-applications'
import { useRealtimeMeetings } from '@/lib/hooks/use-realtime-meetings'
import { KanbanBoard } from '@/components/radar/kanban-board'
import { MobileKanban } from '@/components/radar/mobile-kanban'
import { RadarMobileTimelineNav } from '@/components/radar/radar-mobile-timeline-nav'
import { RadarViewedTracker } from '@/components/radar/radar-viewed-tracker'

type RadarPageShellProps = {
  userId: string
}

/** Section 5.2 / 5.3 / 11 — responsive Radar (desktop Kanban + mobile tabs). */
export function RadarPageShell({ userId }: RadarPageShellProps) {
  const t = useTranslations('radar')

  useRealtimeApplications(userId)
  useRealtimeMeetings(userId)

  const applicationsQuery = useQuery({
    queryKey: userApplicationsQueryKey(userId),
    queryFn: () => fetchUserApplicationsClient(userId),
  })

  const meetingsQuery = useQuery({
    queryKey: timelineMeetingsQueryKey(userId),
    queryFn: () => fetchUpcomingMeetingsClient(userId),
  })

  const isLoading = applicationsQuery.isLoading || meetingsQuery.isLoading
  const isError = applicationsQuery.isError || meetingsQuery.isError
  const errorMessage =
    (applicationsQuery.error as Error | undefined)?.message ??
    (meetingsQuery.error as Error | undefined)?.message

  if (isLoading) {
    return (
      <p className="font-arabic text-sm text-jid-ink/60" aria-live="polite">
        {t('loading')}
      </p>
    )
  }

  if (isError) {
    return (
      <p className="font-arabic text-sm text-red-700" role="alert">
        {errorMessage ?? t('error')}
      </p>
    )
  }

  const applications = applicationsQuery.data?.applications ?? []
  const meetings = meetingsQuery.data?.meetings ?? []

  return (
    <>
      <RadarViewedTracker />
      <div className="hidden lg:block">
        <KanbanBoard userId={userId} applications={applications} meetings={meetings} />
      </div>

      <div className="pb-24 lg:hidden">
        <MobileKanban userId={userId} applications={applications} />
      </div>

      <RadarMobileTimelineNav userId={userId} meetings={meetings} />
    </>
  )
}
