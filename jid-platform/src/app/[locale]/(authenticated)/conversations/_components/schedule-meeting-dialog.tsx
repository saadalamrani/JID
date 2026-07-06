'use client'

import { CalendarPlus, Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MENTOR_MEDIUM_OPTIONS } from '@/lib/mentor-application/constants'
import type { DecryptedMessage } from '@/types/conversation'
import type { MeetingSummary } from '@/types/meeting'

type ScheduleMeetingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  onScheduled: (message: DecryptedMessage) => void
}

function defaultDateTimeLocal(): string {
  const date = new Date()
  date.setHours(date.getHours() + 24, 0, 0, 0)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

/** Section 4.12 — mentor proposes a mentorship meeting from chat. */
export function ScheduleMeetingDialog({
  open,
  onOpenChange,
  conversationId,
  onScheduled,
}: ScheduleMeetingDialogProps) {
  const t = useTranslations('conversations.schedule')
  const locale = useLocale()
  const [scheduledAtLocal, setScheduledAtLocal] = useState(defaultDateTimeLocal)
  const [durationMinutes, setDurationMinutes] = useState('60')
  const [medium, setMedium] = useState('video')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    try {
      const scheduledAt = new Date(scheduledAtLocal)
      if (Number.isNaN(scheduledAt.getTime())) {
        throw new Error(t('invalidDate'))
      }

      const response = await fetch(`/api/conversations/${conversationId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: Number(durationMinutes),
          medium,
          meeting_url: meetingUrl.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })

      const body = (await response.json().catch(() => null)) as {
        error?: string
        message?: DecryptedMessage
        meeting?: MeetingSummary
      } | null

      if (!response.ok) {
        throw new Error(body?.error ?? t('submitError'))
      }

      if (body?.message) {
        onScheduled({
          ...body.message,
          meeting: body.meeting ?? body.message.meeting ?? null,
          plaintext: null,
          decryptState: 'skip',
        })
        toast.success(t('submitSuccess'))
        onOpenChange(false)
        setNotes('')
        setMeetingUrl('')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-jid-line bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-arabic text-jid-ink">{t('dialogTitle')}</DialogTitle>
          <DialogDescription className="font-arabic text-jid-ink/60">
            {t('dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="font-arabic text-sm text-jid-ink">{t('when')}</span>
            <input
              type="datetime-local"
              value={scheduledAtLocal}
              onChange={(event) => setScheduledAtLocal(event.target.value)}
              className="w-full rounded-xl border border-jid-line px-3 py-2 font-arabic text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="font-arabic text-sm text-jid-ink">{t('duration')}</span>
            <select
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              className="w-full rounded-xl border border-jid-line px-3 py-2 font-arabic text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive"
            >
              {[30, 45, 60, 90].map((minutes) => (
                <option key={minutes} value={String(minutes)}>
                  {t('durationValue', { minutes })}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="font-arabic text-sm text-jid-ink">{t('medium')}</span>
            <select
              value={medium}
              onChange={(event) => setMedium(event.target.value)}
              className="w-full rounded-xl border border-jid-line px-3 py-2 font-arabic text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive"
            >
              {MENTOR_MEDIUM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {locale === 'ar' ? option.labelAr : option.labelEn}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="font-arabic text-sm text-jid-ink">{t('link')}</span>
            <input
              type="url"
              value={meetingUrl}
              onChange={(event) => setMeetingUrl(event.target.value)}
              placeholder={t('linkPlaceholder')}
              className="w-full rounded-xl border border-jid-line px-3 py-2 font-arabic text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="font-arabic text-sm text-jid-ink">{t('notes')}</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder={t('notesPlaceholder')}
              className="w-full resize-none rounded-xl border border-jid-line px-3 py-2 font-arabic text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive"
            />
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="font-arabic"
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            className="bg-jid-olive font-arabic hover:bg-jid-olive/90"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
                {t('submitting')}
              </>
            ) : (
              <>
                <CalendarPlus className="me-2 h-4 w-4" aria-hidden />
                {t('submit')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
