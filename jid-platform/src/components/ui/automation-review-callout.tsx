import type { AutomationAuthority } from '@/types/contracts'
import { cn } from '@/lib/utils'

export type AutomationReviewCalloutProps = {
  authority: AutomationAuthority
  explanation: string
  reviewLabel: string
  outputLabel: string
  confirmationRefLabel: string
  confirmationLabel: string
  confirmed?: boolean
  onConfirm?: () => void
  className?: string
}

function canConfirmExternalAction(authority: AutomationAuthority): boolean {
  return (
    authority.consequential_external_action === true &&
    authority.human_review_state === 'APPROVED' &&
    Boolean(authority.external_confirmation_ref)
  )
}

/**
 * Visual contract for Assistive + Explainable + Human-Authorized automation.
 * Consequential external actions stay behind explicit confirmation.
 */
export function AutomationReviewCallout({
  authority,
  explanation,
  reviewLabel,
  outputLabel,
  confirmationRefLabel,
  confirmationLabel,
  confirmed = false,
  onConfirm,
  className,
}: AutomationReviewCalloutProps) {
  const consequential = authority.consequential_external_action
  const confirmEnabled = consequential ? canConfirmExternalAction(authority) : false

  return (
    <aside
      className={cn('border border-border bg-surface p-4 text-start', className)}
      aria-label={explanation}
    >
      <p className="text-sm text-foreground">{explanation}</p>
      <dl className="mt-3 grid gap-1 text-sm text-muted-foreground">
        <div>
          <dt className="inline font-medium text-foreground">{reviewLabel}: </dt>
          <dd className="inline">{authority.human_review_state}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">{outputLabel}: </dt>
          <dd className="inline">{authority.permitted_output_class}</dd>
        </div>
        {consequential ? (
          <div>
            <dt className="inline font-medium text-foreground">{confirmationRefLabel}: </dt>
            <dd className="inline">{authority.external_confirmation_ref.id}</dd>
          </div>
        ) : null}
      </dl>
      {consequential ? (
        <button
          type="button"
          onClick={onConfirm}
          disabled={!confirmEnabled || confirmed || !onConfirm}
          className="mt-4 inline-flex min-h-11 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {confirmationLabel}
        </button>
      ) : null}
    </aside>
  )
}
