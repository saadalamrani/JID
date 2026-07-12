'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { REQUIRED_CLAIM_DOCUMENTS } from '@/lib/validations/staff'
import { cn } from '@/lib/utils'

type RequiredDoc = (typeof REQUIRED_CLAIM_DOCUMENTS)[number]

export type VerificationDecision = 'approved' | 'rejected'

export type VerificationDecisionFormState = {
  decision: VerificationDecision
  reason: string
  requiredDocuments: RequiredDoc[]
}

type VerificationDecisionFormProps = {
  value: VerificationDecisionFormState
  onChange: (next: VerificationDecisionFormState) => void
  checklistComplete: boolean
  isSelfReview: boolean
  submitting: boolean
  onSubmit: () => void
}

const DECISION_OPTIONS: VerificationDecision[] = ['approved', 'rejected']

/** P-108 — approve/reject only (P-102 verification RPCs). */
export function VerificationDecisionForm({
  value,
  onChange,
  checklistComplete,
  isSelfReview,
  submitting,
  onSubmit,
}: VerificationDecisionFormProps) {
  const t = useTranslations('staff.verificationReview.workspace.decision')
  const reasonValid = value.reason.trim().length >= 10
  const rejectDocsValid =
    value.decision !== 'rejected' || value.requiredDocuments.length > 0
  const approveBlocked = value.decision === 'approved' && !checklistComplete
  const canSubmit =
    !isSelfReview && reasonValid && rejectDocsValid && !approveBlocked && !submitting

  return (
    <form
      className="space-y-5 rounded-lg border border-border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) onSubmit()
      }}
    >
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">{t('decisionLabel')}</p>
        <div className="space-y-2">
          {DECISION_OPTIONS.map((option) => (
            <label
              key={option}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm',
                value.decision === option
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card',
                isSelfReview && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="radio"
                name="verification_decision"
                value={option}
                checked={value.decision === option}
                disabled={isSelfReview || submitting}
                onChange={() => onChange({ ...value, decision: option })}
                className="h-4 w-4 accent-primary"
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
          className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
          placeholder={t('reasonPlaceholder')}
        />
        <p className="text-xs text-muted-foreground">{t('reasonHint')}</p>
      </div>

      {value.decision === 'rejected' ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{t('requiredDocumentsLabel')}</p>
          <div className="space-y-2">
            {REQUIRED_CLAIM_DOCUMENTS.map((doc) => {
              const checked = value.requiredDocuments.includes(doc)
              return (
                <label key={doc} className="flex items-center gap-2 text-sm text-muted-foreground">
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
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  {t(`documents.${doc}`)}
                </label>
              )
            })}
          </div>
        </div>
      ) : null}

      {isSelfReview ? (
        <p className="rounded-md border border-sem-warning/30 bg-sem-warning/10 px-3 py-2 text-sm text-sem-warning">
          {t('selfReviewBlocked')}
        </p>
      ) : null}

      {value.decision === 'approved' && !checklistComplete ? (
        <p className="text-sm text-muted-foreground">{t('checklistRequired')}</p>
      ) : null}

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={!canSubmit}
      >
        {submitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  )
}
