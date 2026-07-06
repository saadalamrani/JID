/**
 * @deprecated Radar Day 8 — replace client-side hoursAfter / isMeetingFeedbackDue morph
 * with server-computed `mentorship_meetings.should_show_feedback` (Section 8.2).
 * DO NOT DELETE this file until Day 8 Radar card is wired to the flag.
 */
'use client'

import { CalendarClock, Loader2, Star } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { isMeetingFeedbackDue, isMeetingUpcoming } from '@/lib/meetings/feedback-timing'
import { MENTOR_MEDIUM_OPTIONS } from '@/lib/mentor-application/constants'
import type { RadarMeetingItem } from '@/types/meeting'
import { cn } from '@/lib/utils'

type MeetingRadarCardProps = {
  item: RadarMeetingItem
  onFeedbackSubmitted?: () => void
}

function mediumLabel(value: string | null, locale: string): string | null {
  if (!value) return null
  const option = MENTOR_MEDIUM_OPTIONS.find((entry) => entry.value === value)
  if (!option) return value
  return locale === 'ar' ? option.labelAr : option.labelEn
}

/**
 * Section 4.14 — Radar card morphs into feedback prompt 2+ hours after scheduled_for.
 */
export function MeetingRadarCard({ item, onFeedbackSubmitted }: MeetingRadarCardProps) {
  const t = useTranslations('radar.meeting')
  const locale = useLocale()
  const meeting = item.meeting
  const [now, setNow] = useState(() => Date.now())
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  if (!meeting) return null

  const feedbackSubmitted = meeting.feedback_rating != null
  const showFeedback =
    item.type === 'meeting_feedback' &&
    !feedbackSubmitted &&
    isMeetingFeedbackDue(meeting.scheduled_at, meeting.duration_minutes, now)
  const showUpcoming =
    item.type === 'mentorship_meeting' &&
    meeting.status === 'confirmed' &&
    isMeetingUpcoming(meeting.scheduled_at, meeting.duration_minutes, now)

  if (!showFeedback && !showUpcoming) return null

  async function handleSubmitFeedback() {
    if (!meeting || submitting) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/meetings/${meeting.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          feedback_rating: rating,
          feedback_comment: comment.trim() || undefined,
        }),
      })
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        throw new Error(body?.error ?? t('feedbackError'))
      }
      toast.success(t('feedbackSuccess'))
      onFeedbackSubmitted?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('feedbackError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (showFeedback) {
    return (
      <article className="rounded-xl border border-jid-gold/40 bg-gradient-to-br from-white to-jid-beige/30 p-4 shadow-sm">
        <header className="mb-3">
          <p className="font-arabic text-sm font-semibold text-jid-ink">{t('feedbackTitle')}</p>
          <p className="mt-1 font-arabic text-xs text-jid-ink/60">{t('feedbackBody')}</p>
        </header>

        <div className="mb-3 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className="rounded p-1 transition-colors hover:bg-jid-beige/50"
              aria-label={t('ratingLabel', { value })}
              onClick={() => setRating(value)}
            >
              <Star
                className={cn(
                  'h-5 w-5',
                  value <= rating ? 'fill-jid-gold text-jid-gold' : 'text-jid-line',
                )}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          placeholder={t('feedbackPlaceholder')}
          className="mb-3 w-full resize-none rounded-xl border border-jid-line px-3 py-2 font-arabic text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive"
        />

        <Button
          type="button"
          className="w-full bg-jid-olive font-arabic hover:bg-jid-olive/90"
          disabled={submitting}
          onClick={() => void handleSubmitFeedback()}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : t('feedbackSubmit')}
        </Button>
      </article>
    )
  }

  const when = meeting.scheduled_at
    ? new Date(meeting.scheduled_at).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  return (
    <article className="rounded-xl border border-jid-line bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-jid-olive" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-arabic text-sm font-semibold text-jid-ink">{t('upcomingTitle')}</p>
          <p className="mt-1 font-arabic text-sm text-jid-ink/75">{when}</p>
          {meeting.duration_minutes ? (
            <p className="mt-1 font-arabic text-xs text-jid-ink/55">
              {t('duration', { minutes: meeting.duration_minutes })}
            </p>
          ) : null}
          {mediumLabel(meeting.medium, locale) ? (
            <p className="mt-1 font-arabic text-xs text-jid-ink/55">
              {mediumLabel(meeting.medium, locale)}
            </p>
          ) : null}
          {meeting.meeting_url ? (
            <a
              href={meeting.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-arabic text-xs text-jid-olive underline"
            >
              {t('joinLink')}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}
