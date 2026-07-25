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

type VerificationDecisionFormBaseProps = {
  value: VerificationDecisionFormState
  onChange: (next: VerificationDecisionFormState) => void
  checklistComplete: boolean
  isSelfReview: boolean
  submitting: boolean
  onSubmit: () => void
}

/**
 * Override props are only passed for super_admin viewing another's assigned
 * request. Ordinary staff must never receive these props at all.
 */
type VerificationDecisionFormOverrideProps = {
  allowAssignmentOverride: true
  overrideAssignment: boolean
  onOverrideAssignmentChange: (next: boolean) => void
}

export type VerificationDecisionFormProps =
  | VerificationDecisionFormBaseProps
  | (VerificationDecisionFormBaseProps & VerificationDecisionFormOverrideProps)

function hasOverrideControls(
  props: VerificationDecisionFormProps,
): props is VerificationDecisionFormBaseProps & VerificationDecisionFormOverrideProps {
  return 'allowAssignmentOverride' in props && props.allowAssignmentOverride === true
}

const DECISION_OPTIONS: VerificationDecision[] = ['approved', 'rejected']

/** P-108 — approve/reject only (P-102 verification RPCs). Spec 02-C adds optional override gate. */
export function VerificationDecisionForm(props: VerificationDecisionFormProps) {
  const {
    value,
    onChange,
    checklistComplete,
    isSelfReview,
    submitting,
    onSubmit,
  } = props
  const t = useTranslations('staff.verificationReview.workspace.decision')
  const showOverride = hasOverrideControls(props)
  const overrideChecked = showOverride ? props.overrideAssignment : false
  const overrideBlocksSubmit = showOverride && !overrideChecked
  const fieldsLocked = isSelfReview || overrideBlocksSubmit

  const reasonValid = value.reason.trim().length >= 10
  const rejectDocsValid =
    value.decision !== 'rejected' || value.requiredDocuments.length > 0
  const approveBlocked = value.decision === 'approved' && !checklistComplete
  const canSubmit =
    !isSelfReview &&
    !overrideBlocksSubmit &&
    reasonValid &&
    rejectDocsValid &&
    !approveBlocked &&
    !submitting

  return (
    <form
      className="space-y-5 rounded-lg border border-border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) onSubmit()
      }}
    >
      {showOverride ? (
        <div className="space-y-2 rounded-md border border-border bg-background/40 px-3 py-3">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              data-testid="assignment-override-checkbox"
              checked={overrideChecked}
              disabled={isSelfReview || submitting}
              onChange={(event) => props.onOverrideAssignmentChange(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
            />
            <span className="min-w-0 space-y-1">
              <span className="block font-medium">{t('overrideAssignment.label')}</span>
              <span className="block text-xs text-muted-foreground">
                {t('overrideAssignment.help')}
              </span>
            </span>
          </label>
          {overrideChecked ? (
            <p className="text-xs text-sem-warning">{t('overrideAssignment.confirm')}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{t('overrideAssignment.uncheckedHint')}</p>
          )}
        </div>
      ) : null}

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
                fieldsLocked && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="radio"
                name="verification_decision"
                value={option}
                checked={value.decision === option}
                disabled={fieldsLocked || submitting}
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
          disabled={fieldsLocked || submitting}
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
                    disabled={fieldsLocked || submitting}
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
