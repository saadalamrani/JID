import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type JidPartnerBadgeProps = {
  className?: string
}

/** Section 4.3 — shown only when parent passes hasJidPartnerBadge (never raw score). */
export function JidPartnerBadge({ className }: JidPartnerBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border border-jid-gold-300 bg-accent-100 px-2 py-0.5 font-arabic text-xs font-semibold text-primary-700',
        className,
      )}
      aria-label="شريك جِد"
    >
      <Sparkles className="h-3 w-3 shrink-0 text-accent-600" aria-hidden />
      شريك جِد
    </span>
  )
}
