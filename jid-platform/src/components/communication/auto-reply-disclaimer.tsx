import { AUTO_REPLY_DISCLAIMER_AR } from '@/lib/constants/communication'
import { cn } from '@/lib/utils'

type AutoReplyDisclaimerProps = {
  className?: string
}

/**
 * Spec-locked disclaimer for entities without smart_communication (Prompt 4).
 * Renders the EXACT constant string — no paraphrasing.
 */
export function AutoReplyDisclaimer({ className }: AutoReplyDisclaimerProps) {
  return (
    <p
      className={cn(
        'rounded-md border border-border px-3 py-2 font-arabic text-xs leading-relaxed text-jid-ink-soft',
        className,
      )}
      data-testid="auto-reply-disclaimer"
    >
      {AUTO_REPLY_DISCLAIMER_AR}
    </p>
  )
}
