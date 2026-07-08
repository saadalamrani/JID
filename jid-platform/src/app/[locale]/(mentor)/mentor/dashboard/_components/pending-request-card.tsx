'use client'

import { MessageCircle, MessageSquare, Phone, Users, Video } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  MENTOR_MEDIUM_OPTIONS,
  type MentorMediumValue,
} from '@/lib/mentor-application/constants'
import type { MentorshipRequestRecord } from '@/types/mentorship-request'
import { cn } from '@/lib/utils'

const MEDIUM_ICONS: Record<MentorMediumValue, typeof Video> = {
  video: Video,
  voice: Phone,
  chat: MessageSquare,
  in_person: Users,
}

type PendingRequestCardProps = {
  request: MentorshipRequestRecord
  onReviewed?: () => void
}

export function PendingRequestCard({ request, onReviewed }: PendingRequestCardProps) {
  const t = useTranslations('mentorship.hub.requests')
  const locale = useLocale()
  const router = useRouter()
  const snapshot = request.mentee_snapshot
  const displayName = snapshot?.full_name?.trim() || t('unnamedMentee')
  const [declineOpen, setDeclineOpen] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [submitting, setSubmitting] = useState<'accept' | 'decline' | null>(null)

  const mediumOption = MENTOR_MEDIUM_OPTIONS.find((item) => item.value === request.preferred_medium)
  const MediumIcon = request.preferred_medium
    ? (MEDIUM_ICONS[request.preferred_medium as MentorMediumValue] ?? MessageCircle)
    : MessageCircle
  const mediumLabel = mediumOption
    ? locale === 'en'
      ? mediumOption.labelEn
      : mediumOption.labelAr
    : request.preferred_medium

  async function review(decision: 'accept' | 'decline') {
    setSubmitting(decision)
    try {
      const response = await fetch(`/api/mentor/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          decision,
          decline_reason: decision === 'decline' ? declineReason.trim() : undefined,
        }),
      })
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        throw new Error(body?.error ?? t('reviewError'))
      }
      toast.success(decision === 'accept' ? t('accepted') : t('declined'))
      setDeclineOpen(false)
      setDeclineReason('')
      onReviewed?.()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('reviewError'))
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <ProfileAvatar
          src={snapshot?.avatar_url ?? null}
          alt={displayName}
          size="md"
          variant="circle"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-arabic text-base font-semibold text-foreground">{displayName}</h3>
              {snapshot?.headline ? (
                <p className="font-arabic text-sm text-muted-foreground">{snapshot.headline}</p>
              ) : null}
            </div>
            {request.preferred_medium && mediumLabel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-arabic text-xs font-medium text-primary">
                <MediumIcon className="h-3.5 w-3.5" aria-hidden />
                {mediumLabel}
              </span>
            ) : null}
          </div>

          {snapshot ? (
            <dl className="grid gap-1 font-arabic text-xs text-muted-foreground sm:grid-cols-2">
              {snapshot.university ? (
                <div>
                  <dt className="text-muted-foreground">{t('university')}</dt>
                  <dd>{snapshot.university}</dd>
                </div>
              ) : null}
              {snapshot.college ? (
                <div>
                  <dt className="text-muted-foreground">{t('college')}</dt>
                  <dd>{snapshot.college}</dd>
                </div>
              ) : null}
              {snapshot.city ? (
                <div>
                  <dt className="text-muted-foreground">{t('city')}</dt>
                  <dd>{snapshot.city}</dd>
                </div>
              ) : null}
              {snapshot.target_sectors.length > 0 ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">{t('targetSectors')}</dt>
                  <dd>{snapshot.target_sectors.join(' · ')}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {request.focus_area ? (
            <span className="inline-flex rounded-full bg-accent/10 px-2 py-0.5 font-arabic text-xs text-foreground">
              {request.focus_area}
            </span>
          ) : null}

          {request.intent_statement ? (
            <blockquote className="border-s-4 border-jid-olive/40 ps-3 font-arabic text-sm italic text-muted-foreground">
              “{request.intent_statement}”
            </blockquote>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              disabled={submitting !== null}
              className="bg-primary font-arabic hover:bg-primary/90"
              onClick={() => void review('accept')}
            >
              {submitting === 'accept' ? t('accepting') : t('accept')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={submitting !== null}
              className="font-arabic border-border"
              onClick={() => setDeclineOpen(true)}
            >
              {t('decline')}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-arabic text-foreground">{t('declineTitle')}</DialogTitle>
            <DialogDescription className="font-arabic text-muted-foreground">
              {t('declineDescription')}
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={declineReason}
            onChange={(event) => setDeclineReason(event.target.value)}
            rows={4}
            className={cn(
              'w-full rounded-lg border border-border px-3 py-2 font-arabic text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive',
            )}
            placeholder={t('declinePlaceholder')}
          />
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="font-arabic border-border"
              onClick={() => setDeclineOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              disabled={!declineReason.trim() || submitting === 'decline'}
              className="bg-red-600 font-arabic hover:bg-red-600/90"
              onClick={() => void review('decline')}
            >
              {submitting === 'decline' ? t('declining') : t('confirmDecline')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  )
}
