'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  ClaimChecklist,
  createDefaultChecklist,
  isChecklistComplete,
  type ChecklistState,
} from '@/app/[locale]/(staff)/_components/claim-checklist'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { claimsQueueQueryKey } from '@/hooks/use-claims-queue'
import type { ClaimQueueItem } from '@/lib/staff/claims'
import { reviewClaimRequest } from '@/lib/staff/review-claim'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from '@/lib/i18n/navigation'

type ClaimReviewModalProps = {
  claim: ClaimQueueItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClaimReviewModal({ claim, open, onOpenChange }: ClaimReviewModalProps) {
  const t = useTranslations('staff.claimReview')
  const router = useRouter()
  const queryClient = useQueryClient()
  const [checklist, setChecklist] = useState<ChecklistState>(() =>
    createDefaultChecklist(
      claim.business_email,
      claim.claimant_title,
      claim.company_domains ?? [],
    ),
  )
  const [reviewNotes, setReviewNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    setChecklist(
      createDefaultChecklist(
        claim.business_email,
        claim.claimant_title,
        claim.company_domains ?? [],
      ),
    )
    setReviewNotes('')
    setRejectionReason('')
  }, [claim])

  const mutation = useMutation({
    mutationFn: async (decision: 'approve' | 'reject') => {
      const supabase = createClient()
      await reviewClaimRequest(supabase, {
        claimId: claim.id,
        decision,
        reviewNotes,
        rejectionReason: decision === 'reject' ? rejectionReason : undefined,
      })
    },
    onSuccess: (_data, decision) => {
      toast.success(decision === 'approve' ? t('approved') : t('rejected'))
      void queryClient.invalidateQueries({ queryKey: claimsQueueQueryKey })
      onOpenChange(false)
      router.push('/staff/claims/queue')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  function validateNotes(): boolean {
    if (!reviewNotes.trim()) {
      toast.error(t('notesRequired'))
      return false
    }
    return true
  }

  function handleApprove() {
    if (!validateNotes()) return
    if (!isChecklistComplete(checklist)) {
      toast.error(t('checklistIncomplete'))
      return
    }
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

  const submitting = mutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title', { company: claim.company_name })}</DialogTitle>
          <DialogDescription>
            {claim.claimant_name}
            {claim.claimant_title ? ` · ${claim.claimant_title}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <h3 className="mb-3 text-sm font-semibold text-jid-ink">{t('checklistTitle')}</h3>
            <ClaimChecklist
              businessEmail={claim.business_email}
              claimantTitle={claim.claimant_title}
              companyDomains={claim.company_domains ?? []}
              value={checklist}
              onChange={setChecklist}
              disabled={submitting}
            />
          </section>

          <section className="space-y-2">
            <label htmlFor="review_notes" className="text-sm font-medium text-jid-ink">
              {t('reviewNotes')}
            </label>
            <textarea
              id="review_notes"
              rows={4}
              disabled={submitting}
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              className="w-full rounded-md border border-jid-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-jid-gold"
              placeholder={t('reviewNotesPlaceholder')}
            />
          </section>

          <section className="space-y-2">
            <label htmlFor="rejection_reason" className="text-sm font-medium text-jid-ink">
              {t('rejectionReason')}
            </label>
            <textarea
              id="rejection_reason"
              rows={3}
              disabled={submitting}
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              className="w-full rounded-md border border-jid-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-jid-gold"
              placeholder={t('rejectionReasonPlaceholder')}
            />
            <p className="text-xs text-jid-ink/50">{t('rejectionReasonHint')}</p>
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
              className="border-red-300 text-red-700 hover:bg-red-50"
              disabled={submitting}
              onClick={handleReject}
            >
              {submitting ? t('submitting') : t('reject')}
            </Button>
            <Button
              type="button"
              className="bg-jid-olive hover:bg-jid-olive/90"
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
