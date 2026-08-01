import { Link } from '@/lib/i18n/navigation'
import { OrgOutcomePanel } from '@/components/entity/org-outcome-panel'

type RejectedVerificationPanelProps = {
  title: string
  orgName: string
  reasonLabel: string
  reasonText: string
  documentsLabel: string
  documentsText: string
  cooldownText: string | null
  canReapply: boolean
  reapplyHref: string
  reapplyCta: string
  blockedMessage: string
}

/** Spec 08-D — shared rejected Verification surface for Business and University. */
export function RejectedVerificationPanel({
  title,
  orgName,
  reasonLabel,
  reasonText,
  documentsLabel,
  documentsText,
  cooldownText,
  canReapply,
  reapplyHref,
  reapplyCta,
  blockedMessage,
}: RejectedVerificationPanelProps) {
  return (
    <OrgOutcomePanel tone="rejected" testId="rejected-verification-panel">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{orgName}</p>

      <div className="mt-6 space-y-3 text-sm">
        <p>
          <span className="text-muted-foreground">{reasonLabel}:</span>{' '}
          <span className="font-medium break-words text-foreground">{reasonText}</span>
        </p>
        <p>
          <span className="text-muted-foreground">{documentsLabel}:</span>{' '}
          <span className="font-medium break-words text-foreground">{documentsText}</span>
        </p>
        {cooldownText ? <p className="text-muted-foreground">{cooldownText}</p> : null}
      </div>

      {canReapply ? (
        <Link
          href={reapplyHref}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-gold/60 focus-visible:ring-offset-2"
        >
          {reapplyCta}
        </Link>
      ) : (
        <p
          role="status"
          className="mt-6 rounded-md border border-border bg-jid-beige/60 p-3 text-sm text-muted-foreground"
        >
          {blockedMessage}
        </p>
      )}
    </OrgOutcomePanel>
  )
}
