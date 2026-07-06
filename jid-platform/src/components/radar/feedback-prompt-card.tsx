'use client'

import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Loader2, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { timelineMeetingsQueryKey } from '@/lib/queries/timeline'
import { dismissForLater, submitFeedback } from '@/lib/timeline/feedback-actions'
import type { TimelineMeeting } from '@/types/timeline'
import { track } from '@/lib/analytics/track'
import { cn } from '@/lib/utils'

const CARD_SPRING = { type: 'spring' as const, stiffness: 420, damping: 32 }

type FeedbackPromptCardProps = {
  meeting: TimelineMeeting
  userId: string
  className?: string
}

/** Section 8.5 — feedback morph card (shared layoutId with MeetingCard). */
export function FeedbackPromptCard({ meeting, userId, className }: FeedbackPromptCardProps) {
  const t = useTranslations('radar.meeting')
  const tTimeline = useTranslations('radar.timeline')
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  const mentorName = meeting.mentor?.profile?.full_name ?? tTimeline('unknownMentor')

  async function invalidateTimeline() {
    await queryClient.invalidateQueries({ queryKey: timelineMeetingsQueryKey(userId) })
  }

  async function handleSubmitFeedback() {
    if (submitting) return
    setSubmitting(true)
    try {
      await submitFeedback(meeting.id, rating, comment)
      track('radar_feedback_submitted', { meeting_id: meeting.id, rating })
      toast.success(t('feedbackSuccess'))
      await invalidateTimeline()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('feedbackError'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDismissForLater() {
    if (dismissing) return
    setDismissing(true)
    try {
      await dismissForLater(meeting.id)
      track('radar_feedback_dismissed', { meeting_id: meeting.id })
      toast.message(t('feedbackDismissed'))
      await invalidateTimeline()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('feedbackError'))
    } finally {
      setDismissing(false)
    }
  }

  return (
    <motion.article
      layout
      layoutId={`meeting-${meeting.id}`}
      transition={CARD_SPRING}
      className={cn(
        'rounded-xl border border-jid-gold/40 bg-gradient-to-br from-white to-jid-beige/30 p-4 shadow-sm',
        className,
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <ProfileAvatar
          src={meeting.mentor?.profile?.avatar_url}
          alt={mentorName}
          size="sm"
          className="shrink-0"
        />
        <header className="min-w-0 flex-1">
          <p className="font-arabic text-sm font-semibold text-jid-ink">{t('feedbackTitle')}</p>
          <p className="mt-0.5 font-arabic text-xs text-jid-ink/60">{mentorName}</p>
          <p className="mt-1 font-arabic text-xs text-jid-ink/60">{t('feedbackBody')}</p>
        </header>
      </div>

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

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="w-full bg-jid-olive font-arabic hover:bg-jid-olive/90"
          disabled={submitting || dismissing}
          onClick={() => void handleSubmitFeedback()}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : t('feedbackSubmit')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full font-arabic text-jid-ink/70"
          disabled={submitting || dismissing}
          onClick={() => void handleDismissForLater()}
        >
          {dismissing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : t('dismissForLater')}
        </Button>
      </div>
    </motion.article>
  )
}
