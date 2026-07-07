'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  REQUIRED_CLAIM_DOCUMENTS,
  type ClaimReviewDecision,
} from '@/lib/validations/staff'
import { cn } from '@/lib/utils'

type RequiredDoc = (typeof REQUIRED_CLAIM_DOCUMENTS)[number]

export type ClaimDecisionFormState = {
  decision: ClaimReviewDecision
  reason: string
  requiredDocuments: RequiredDoc[]
}

type ClaimDecisionFormProps = {
  value: ClaimDecisionFormState
  onChange: (next: ClaimDecisionFormState) => void
  checklistComplete: boolean
  isSelfReview: boolean
  submitting: boolean
  onSubmit: () => void
}

const DECISION_OPTIONS: ClaimReviewDecision[] = ['approved', 'rejected', 'needs_more_info']

/** Section 7.5 / 7.7 — decision form with mandatory reason and rejection documents. */
export function ClaimDecisionForm({
  value,
  onChange,
  checklistComplete,
  isSelfReview,
  submitting,
  onSubmit,
}: ClaimDecisionFormProps) {
  const t = useTranslations('staff.claimReview.workspace.decision')
  const reasonValid = value.reason.trim().length >= 10
  const rejectDocsValid =
    value.decision !== 'rejected' || value.requiredDocuments.length > 0
  const approveBlocked = value.decision === 'approved' && !checklistComplete
  const canSubmit =
    !isSelfReview && reasonValid && rejectDocsValid && !approveBlocked && !submitting

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
          {DECISION_OPTIONS.map((option) => (
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
                name="claim_decision"
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
        <Label htmlFor="review_reason">{t('reasonLabel')}</Label>
        <textarea
          id="review_reason"
          rows={4}
          disabled={isSelfReview || submitting}
          value={value.reason}
          onChange={(event) => onChange({ ...value, reason: event.target.value })}
          className="w-full rounded-md border border-jid-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-jid-gold"
          placeholder={t('reasonPlaceholder')}
        />
        <p className="text-xs text-jid-ink/50">{t('reasonHint')}</p>
      </div>

      {value.decision === 'rejected' ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-jid-ink">{t('requiredDocumentsLabel')}</p>
          <div className="space-y-2">
            {REQUIRED_CLAIM_DOCUMENTS.map((doc) => {
              const checked = value.requiredDocuments.includes(doc)
              return (
                <label key={doc} className="flex items-center gap-2 text-sm text-jid-ink/80">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isSelfReview || submitting}
                    onChange={() => {
                      const next = checked
                        ? value.requiredDocuments.filter((item) => item !== doc)
                        : [...value.requiredDocuments, doc]
                      onChange({ ...value, requiredDocuments: next })
                    }}
                    className="h-4 w-4 rounded border-jid-line accent-jid-olive"
                  />
                  {t(`documents.${doc}`)}
                </label>
              )
            })}
          </div>
        </div>
      ) : null}

      {isSelfReview ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t('selfReviewBlocked')}
        </p>
      ) : null}

      {value.decision === 'approved' && !checklistComplete ? (
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
