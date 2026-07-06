'use client'

import { LayoutGroup } from 'framer-motion'
import { CalendarClock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FeedbackPromptCard } from '@/components/radar/feedback-prompt-card'
import { MeetingCard } from '@/components/radar/meeting-card'
import { partitionTimelineMeetings } from '@/lib/timeline/partition-meetings'
import type { TimelineMeeting } from '@/types/timeline'

type MentorshipTimelineProps = {
  userId: string
  meetings: TimelineMeeting[]
  title: string
}

function TimelineMeetingSlot({
  meeting,
  userId,
}: {
  meeting: TimelineMeeting
  userId: string
}) {
  const showFeedback = meeting.should_show_feedback && meeting.feedback_rating == null

  if (showFeedback) {
    return <FeedbackPromptCard meeting={meeting} userId={userId} />
  }

  return <MeetingCard meeting={meeting} />
}

/** Section 8.3 — mentorship timeline with feedback + upcoming sections. */
export function MentorshipTimeline({ userId, meetings, title }: MentorshipTimelineProps) {
  const t = useTranslations('radar.timeline')
  const { needsFeedback, upcoming } = partitionTimelineMeetings(meetings)
  const isEmpty = needsFeedback.length === 0 && upcoming.length === 0

  return (
    <section className="rounded-xl border border-jid-line/50 bg-white p-4">
      <header className="mb-4 flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-jid-olive" aria-hidden />
        <h2 className="font-arabic text-sm font-semibold text-jid-ink">{title}</h2>
      </header>

      {isEmpty ? (
        <p className="font-arabic text-sm text-jid-ink/55">{t('empty')}</p>
      ) : (
        <LayoutGroup id="radar-mentorship-timeline">
          <div className="space-y-6">
            {needsFeedback.length > 0 ? (
              <div>
                <h3 className="mb-3 font-arabic text-xs font-semibold uppercase tracking-wide text-jid-ink/50">
                  {t('needsFeedback')}
                </h3>
                <ul className="space-y-3">
                  {needsFeedback.map((meeting) => (
                    <li key={meeting.id}>
                      <TimelineMeetingSlot meeting={meeting} userId={userId} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {upcoming.length > 0 ? (
              <div>
                <h3 className="mb-3 font-arabic text-xs font-semibold uppercase tracking-wide text-jid-ink/50">
                  {t('upcoming')}
                </h3>
                <ul className="space-y-3">
                  {upcoming.map((meeting) => (
                    <li key={meeting.id}>
                      <TimelineMeetingSlot meeting={meeting} userId={userId} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </LayoutGroup>
      )}
    </section>
  )
}
