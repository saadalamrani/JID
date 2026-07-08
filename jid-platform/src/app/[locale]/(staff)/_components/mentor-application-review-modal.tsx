'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MentorExpertiseSection } from '@/components/profile/mentor-expertise-section'
import { MentorIdentityHeader } from '@/components/profile/mentor-identity-header'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { mentorApplicationsQueryKey } from '@/hooks/use-mentor-applications-queue'
import type { MentorApplicationQueueItem } from '@/lib/staff/mentor-applications'

type MentorApplicationReviewModalProps = {
  application: MentorApplicationQueueItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MentorApplicationReviewModal({
  application,
  open,
  onOpenChange,
}: MentorApplicationReviewModalProps) {
  const t = useTranslations('staff.mentorApplications.review')
  const queryClient = useQueryClient()
  const [reviewNotes, setReviewNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    setReviewNotes('')
    setRejectionReason('')
  }, [application?.user_id])

  const mutation = useMutation({
    mutationFn: async (decision: 'approve' | 'reject') => {
      if (!application) throw new Error(t('notFound'))

      const response = await fetch(`/api/admin/mentor-applications/${application.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          decision,
          review_notes: reviewNotes,
          rejection_reason: decision === 'reject' ? rejectionReason : undefined,
        }),
      })

      const body = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        throw new Error(body?.error ?? t('submitError'))
      }
    },
    onSuccess: (_data, decision) => {
      toast.success(decision === 'approve' ? t('approved') : t('rejected'))
      void queryClient.invalidateQueries({ queryKey: mentorApplicationsQueryKey })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  if (!application) return null

  const submitting = mutation.isPending

  function validateNotes(): boolean {
    if (!reviewNotes.trim()) {
      toast.error(t('notesRequired'))
      return false
    }
    return true
  }

  function handleApprove() {
    if (!validateNotes()) return
    mutation.mutate('approve')
  }

  function handleReject() {
    if (!validateNotes()) return
    if (!rejectionReason.trim()) {
      toast.error(t('rejectionReasonRequired'))
      return
    }
    mutation.mutate('reject')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title', { name: application.applicant_name ?? t('unnamed') })}</DialogTitle>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <MentorIdentityHeader
            isOwner={false}
            fullName={application.applicant_name ?? t('unnamed')}
            headline={application.headline}
            bioSnippet={application.bio_long}
            avatarUrl={application.applicant_avatar_url}
            status={application.status}
          />

          <MentorExpertiseSection
            sectors={application.expertise_areas}
            yearsExperience={application.years_experience}
          />

          <section className="rounded-xl border border-border bg-background/20 p-4 text-sm">
            <dl className="space-y-2">
              {application.linkedin_url ? (
                <div>
                  <dt className="text-xs text-muted-foreground">{t('linkedin')}</dt>
                  <dd className="mt-1 break-all text-primary" dir="ltr">
                    {application.linkedin_url}
                  </dd>
                </div>
              ) : null}
              {application.languages.length > 0 ? (
                <div>
                  <dt className="text-xs text-muted-foreground">{t('languages')}</dt>
                  <dd className="mt-1 text-foreground">{application.languages.join('، ')}</dd>
                </div>
              ) : null}
              {application.preferred_mediums.length > 0 ? (
                <div>
                  <dt className="text-xs text-muted-foreground">{t('mediums')}</dt>
                  <dd className="mt-1 text-foreground">{application.preferred_mediums.join('، ')}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="space-y-2">
            <label htmlFor="mentor_review_notes" className="text-sm font-medium text-foreground">
              {t('reviewNotes')}
            </label>
            <textarea
              id="mentor_review_notes"
              rows={4}
              disabled={submitting}
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
              placeholder={t('reviewNotesPlaceholder')}
            />
          </section>

          <section className="space-y-2">
            <label htmlFor="mentor_rejection_reason" className="text-sm font-medium text-foreground">
              {t('rejectionReason')}
            </label>
            <textarea
              id="mentor_rejection_reason"
              rows={3}
              disabled={submitting}
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
              placeholder={t('rejectionReasonPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">{t('rejectionReasonHint')}</p>
          </section>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              disabled={submitting}
              onClick={handleReject}
            >
              {submitting ? t('submitting') : t('reject')}
            </Button>
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90"
              disabled={submitting}
              onClick={handleApprove}
            >
              {submitting ? t('submitting') : t('approve')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
