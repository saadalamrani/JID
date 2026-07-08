'use client'

import { motion } from 'framer-motion'
import { CalendarClock, Video } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { MENTOR_MEDIUM_OPTIONS } from '@/lib/mentor-application/constants'
import { meetingStatusLabel } from '@/lib/radar/status-labels'
import type { TimelineMeeting } from '@/types/timeline'
import { track } from '@/lib/analytics/track'
import { cn } from '@/lib/utils'

const CARD_SPRING = { type: 'spring' as const, stiffness: 420, damping: 32 }

type MeetingCardProps = {
  meeting: TimelineMeeting
  className?: string
}

function mediumLabel(value: string | null, locale: string): string | null {
  if (!value) return null
  const option = MENTOR_MEDIUM_OPTIONS.find((entry) => entry.value === value)
  if (!option) return value
  return locale === 'ar' ? option.labelAr : option.labelEn
}

/** Section 8.4 — upcoming mentorship session card (mentor.profile.full_name path). */
export function MeetingCard({ meeting, className }: MeetingCardProps) {
  const t = useTranslations('radar.meeting')
  const tTimeline = useTranslations('radar.timeline')
  const locale = useLocale()

  const mentorName = meeting.mentor?.profile?.full_name ?? tTimeline('unknownMentor')
  const mentorRole = meeting.mentor?.current_role
  const when = meeting.scheduled_for
    ? new Date(meeting.scheduled_for).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : meetingStatusLabel(meeting.status)

  return (
    <motion.article
      layout
      layoutId={`meeting-${meeting.id}`}
      transition={CARD_SPRING}
      className={cn(
        'rounded-xl border border-border bg-card p-4 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <ProfileAvatar
          src={meeting.mentor?.profile?.avatar_url}
          alt={mentorName}
          size="sm"
          className="shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <p className="font-arabic text-sm font-semibold text-foreground">{t('upcomingTitle')}</p>
          </div>

          <p className="font-arabic text-sm font-medium text-foreground">{mentorName}</p>
          {mentorRole ? (
            <p className="mt-0.5 line-clamp-1 font-arabic text-xs text-muted-foreground">{mentorRole}</p>
          ) : null}

          <p className="mt-2 font-arabic text-sm text-foreground/75">{when}</p>

          {meeting.duration_text ? (
            <p className="mt-1 font-arabic text-xs text-foreground/55">{meeting.duration_text}</p>
          ) : null}

          {mediumLabel(meeting.medium, locale) ? (
            <p className="mt-1 font-arabic text-xs text-foreground/55">
              {mediumLabel(meeting.medium, locale)}
            </p>
          ) : null}

          {meeting.meeting_url ? (
            <a
              href={meeting.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 font-arabic text-xs text-primary underline"
              onClick={() => track('radar_meeting_joined', { meeting_id: meeting.id })}
            >
              <Video className="h-3.5 w-3.5" aria-hidden />
              {t('joinLink')}
            </a>
          ) : null}
        </div>
      </div>
    </motion.article>
  )
}
