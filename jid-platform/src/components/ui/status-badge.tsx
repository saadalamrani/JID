import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium tracking-normal',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-secondary text-secondary-foreground',
        success: 'border-transparent bg-success/15 text-success',
        warning: 'border-transparent bg-warning/15 text-warning',
        destructive: 'border-transparent bg-destructive/15 text-destructive',
        /** Brand/accent — use only when status is genuinely brand-linked. */
        brand: 'border-transparent bg-accent/20 text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof statusBadgeVariants> & {
    /** Visible status label — required; color alone is never sufficient. */
    children: string
  }

/**
 * Shared status chip — text always present; not a decorative pill system.
 * Domain-specific badges (e.g. application pipeline) remain separate.
 */
export function StatusBadge({
  className,
  variant,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  )
}

export { statusBadgeVariants }
