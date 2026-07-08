'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { MentorshipTimeline } from '@/components/radar/mentorship-timeline'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import type { TimelineMeeting } from '@/types/timeline'
import { track } from '@/lib/analytics/track'
import { cn } from '@/lib/utils'

type RadarMobileTimelineNavProps = {
  userId: string
  meetings: TimelineMeeting[]
}

/** Section 11.2 — bottom nav tab opening full-screen MentorshipTimeline (mentees + mentors). */
export function RadarMobileTimelineNav({ userId, meetings }: RadarMobileTimelineNavProps) {
  const t = useTranslations('radar.mobile')
  const [open, setOpen] = useState(false)

  if (meetings.length === 0) return null

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm lg:hidden"
        aria-label={t('timelineNavLabel')}
      >
        <div className="container-jid flex justify-center py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-arabic text-sm font-medium',
              open ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-background',
            )}
            onClick={() => {
              setOpen(true)
              track('radar_meeting_opened', { source: 'mobile_timeline_tab' })
            }}
          >
            <span aria-hidden>📅</span>
            <span>{t('timelineTab')}</span>
            <span className="rounded-full bg-card/90 px-2 py-0.5 text-xs font-semibold text-primary">
              {meetings.length}
            </span>
          </button>
        </div>
      </nav>

      <BottomSheet open={open} onOpenChange={setOpen} fullScreen title={t('timelineSheetTitle')}>
        <MentorshipTimeline userId={userId} meetings={meetings} title={t('timelineSheetTitle')} />
      </BottomSheet>
    </>
  )
}
