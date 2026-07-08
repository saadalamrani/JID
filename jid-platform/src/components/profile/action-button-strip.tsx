import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ActionButtonStripProps = {
  children: ReactNode
  className?: string
  /** Accessible label for the action region (Layer 5). */
  ariaLabel?: string
}

/**
 * Generic container for contextual profile actions (Layer 5).
 * Populated per viewer role on later days.
 */
export function ActionButtonStrip({ children, className, ariaLabel }: ActionButtonStripProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 border-t border-border pt-4',
        className,
      )}
      role="toolbar"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  )
}
