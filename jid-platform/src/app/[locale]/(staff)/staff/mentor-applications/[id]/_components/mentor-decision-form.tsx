'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type MentorDecisionFormState = {
  decision: 'approve' | 'reject'
  reviewNotes: string
  rejectionReason: string
}

type MentorDecisionFormProps = {
  value: MentorDecisionFormState
  onChange: (next: MentorDecisionFormState) => void
  checklistComplete: boolean
  isSelfReview: boolean
  submitting: boolean
  onSubmit: () => void
}

export function MentorDecisionForm({
  value,
  onChange,
  checklistComplete,
  isSelfReview,
  submitting,
  onSubmit,
}: MentorDecisionFormProps) {
  const t = useTranslations('staff.mentorApplications.workspace.decision')
  const notesValid = value.reviewNotes.trim().length >= 1
  const rejectValid = value.decision !== 'reject' || value.rejectionReason.trim().length >= 1
  const approveBlocked = value.decision === 'approve' && !checklistComplete
  const canSubmit = !isSelfReview && notesValid && rejectValid && !approveBlocked && !submitting

  return (
    <form
      className="space-y-5 rounded-lg border border-jid-line bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) onSubmit()
      }}
    >
      <div>
        <p className="mb-2 text-sm font-medium text-jid-ink">{t('decisionLabel')}</p>
        <div className="space-y-2">
          {(['approve', 'reject'] as const).map((option) => (
            <label
              key={option}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm',
                value.decision === option
                  ? 'border-jid-olive bg-jid-olive/5'
                  : 'border-jid-line bg-white',
                isSelfReview && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="radio"
                name="mentor_decision"
                value={option}
                checked={value.decision === option}
                disabled={isSelfReview || submitting}
                onChange={() => onChange({ ...value, decision: option })}
                className="h-4 w-4 accent-jid-olive"
              />
              <span>{t(`options.${option}`)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mentor_review_notes">{t('reviewNotesLabel')}</Label>
        <textarea
          id="mentor_review_notes"
          rows={3}
          disabled={isSelfReview || submitting}
          value={value.reviewNotes}
          onChange={(event) => onChange({ ...value, reviewNotes: event.target.value })}
          className="w-full rounded-md border border-jid-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-jid-gold"
          placeholder={t('reviewNotesPlaceholder')}
        />
      </div>

      {value.decision === 'reject' ? (
        <div className="space-y-2">
          <Label htmlFor="mentor_rejection_reason">{t('rejectionReasonLabel')}</Label>
          <textarea
            id="mentor_rejection_reason"
            rows={3}
            disabled={isSelfReview || submitting}
            value={value.rejectionReason}
            onChange={(event) => onChange({ ...value, rejectionReason: event.target.value })}
            className="w-full rounded-md border border-jid-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-jid-gold"
            placeholder={t('rejectionReasonPlaceholder')}
          />
        </div>
      ) : null}

      {isSelfReview ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t('selfReviewBlocked')}
        </p>
      ) : null}

      {value.decision === 'approve' && !checklistComplete ? (
        <p className="text-sm text-jid-ink/60">{t('checklistRequired')}</p>
      ) : null}

      <Button
        type="submit"
        className="w-full bg-jid-olive hover:bg-jid-olive/90"
        disabled={!canSubmit}
      >
        {submitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  )
}
