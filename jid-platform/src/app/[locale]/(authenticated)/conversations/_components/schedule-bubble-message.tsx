'use client'

import { CalendarClock, Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { MENTOR_MEDIUM_OPTIONS } from '@/lib/mentor-application/constants'
import type { MeetingSummary } from '@/types/meeting'
import { cn } from '@/lib/utils'

type ScheduleBubbleMessageProps = {
  meeting: MeetingSummary | null | undefined
  isOwn: boolean
  viewerId: string
  onMeetingUpdated?: (meeting: MeetingSummary) => void
}

function mediumLabel(value: string | null, locale: string): string | null {
  if (!value) return null
  const option = MENTOR_MEDIUM_OPTIONS.find((item) => item.value === value)
  if (!option) return value
  return locale === 'ar' ? option.labelAr : option.labelEn
}

function formatScheduleDate(value: string | null, locale: string): string {
  if (!value) return '—'
  return new Date(value).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Section 4.12 — schedule_proposal bubble (unencrypted operational data).
 * Structure: header → datetime → duration → medium → notes → status → action.
 */
export function ScheduleBubbleMessage({
  meeting,
  isOwn,
  viewerId,
  onMeetingUpdated,
}: ScheduleBubbleMessageProps) {
  const t = useTranslations('conversations.schedule')
  const locale = useLocale()
  const [confirming, setConfirming] = useState(false)

  if (!meeting) {
    return (
      <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
        <div className="rounded-2xl border border-dashed border-border bg-white px-4 py-3 font-arabic text-sm text-muted-foreground">
          {t('loading')}
        </div>
      </div>
    )
  }

  const canConfirm =
    meeting.status === 'pending_confirmation' && viewerId === meeting.mentee_id
  const medium = mediumLabel(meeting.medium, locale)

  async function handleConfirm() {
    if (!meeting || confirming) return
    setConfirming(true)
    try {
      const response = await fetch(`/api/meetings/${meeting.id}/confirm`, {
        method: 'PATCH',
        credentials: 'include',
      })
      const body = (await response.json().catch(() => null)) as {
        error?: string
        meeting?: MeetingSummary
      } | null
      if (!response.ok) {
        throw new Error(body?.error ?? t('confirmError'))
      }
      if (body?.meeting) {
        onMeetingUpdated?.(body.meeting)
        toast.success(t('confirmSuccess'))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('confirmError'))
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <article
        className={cn(
          'w-full max-w-sm overflow-hidden rounded-2xl border shadow-sm',
          isOwn ? 'border-primary/40 bg-primary/5' : 'border-border bg-white',
        )}
      >
        <header className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <CalendarClock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h3 className="font-arabic text-sm font-semibold text-foreground">{t('title')}</h3>
        </header>

        <div className="space-y-2 px-4 py-3 font-arabic text-sm text-foreground">
          <div className="flex justify-between gap-3">
            <span className="text-foreground/55">{t('when')}</span>
            <span className="text-end font-medium">{formatScheduleDate(meeting.scheduled_at, locale)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-foreground/55">{t('duration')}</span>
            <span className="font-medium">
              {meeting.duration_minutes
                ? t('durationValue', { minutes: meeting.duration_minutes })
                : '—'}
            </span>
          </div>
          {medium ? (
            <div className="flex justify-between gap-3">
              <span className="text-foreground/55">{t('medium')}</span>
              <span className="font-medium">{medium}</span>
            </div>
          ) : null}
          {meeting.meeting_url ? (
            <div className="flex flex-col gap-1">
              <span className="text-foreground/55">{t('link')}</span>
              <a
                href={meeting.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-primary underline"
              >
                {meeting.meeting_url}
              </a>
            </div>
          ) : null}
          {meeting.notes ? (
            <div className="rounded-lg bg-background/40 px-3 py-2 text-xs text-foreground/75">
              {meeting.notes}
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-border/60 px-4 py-3">
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 font-arabic text-xs font-medium',
              meeting.status === 'pending_confirmation'
                ? 'bg-amber-100 text-amber-800'
                : meeting.status === 'confirmed'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-background text-foreground/60',
            )}
          >
            {t(`status.${meeting.status}`)}
          </span>

          {canConfirm ? (
            <Button
              type="button"
              size="sm"
              className="bg-primary font-arabic hover:bg-primary/90"
              disabled={confirming}
              onClick={() => void handleConfirm()}
            >
              {confirming ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                t('confirmCta')
              )}
            </Button>
          ) : null}
        </footer>
      </article>
    </div>
  )
}
