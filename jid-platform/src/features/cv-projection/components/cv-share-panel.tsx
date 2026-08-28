'use client'

import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { focusRingClass, touchTargetClass } from '@/lib/ui/a11y'
import { cn } from '@/lib/utils'
import type { CvProjectionCopy } from '../copy'
import type { CvSharePresentation } from '../operations'

type CvSharePanelProps = {
  copy: CvProjectionCopy
  share: CvSharePresentation
  shareBusy?: boolean
  shareMessage?: string | null
  onRequestShare?: () => void
}

export function CvSharePanel({
  copy,
  share,
  shareBusy = false,
  shareMessage = null,
  onRequestShare,
}: CvSharePanelProps) {
  const statusLabel =
    share.kind === 'private'
      ? copy.sharePrivate
      : share.kind === 'awaiting_authorization'
        ? copy.shareAwaiting
        : copy.shareAuthorized

  return (
    <section className="space-y-3" aria-labelledby="cv-share-heading">
      <SectionHeader id="cv-share-heading" title={copy.shareTitle} />
      <StatusBadge variant={share.kind === 'authorized' ? 'success' : 'neutral'}>
        {statusLabel}
      </StatusBadge>
      <ul className="space-y-1 text-sm text-foreground">
        <li>{copy.inRecord}</li>
        <li>{copy.inThisCv}</li>
        <li>
          {copy.sharedWithRecipient}
          {share.kind === 'authorized' ? `: ${share.recipient_label}` : ` — ${copy.sharePrivate}`}
        </li>
      </ul>
      <p className="text-sm text-muted-foreground">{copy.scopesHint}</p>
      <p className="text-sm text-muted-foreground">{copy.privateDefault}</p>
      {onRequestShare ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={cn(touchTargetClass, focusRingClass)}
          disabled={shareBusy || share.kind === 'authorized'}
          onClick={onRequestShare}
        >
          {copy.requestShare}
        </Button>
      ) : null}
      {shareMessage ? (
        <p role="status" className="text-sm text-muted-foreground">
          {shareMessage}
        </p>
      ) : null}
    </section>
  )
}
