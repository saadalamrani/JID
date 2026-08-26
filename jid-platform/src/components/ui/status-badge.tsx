import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { contractStatusVariant, type ContractStatusBinding } from '@/lib/ui/contract-presentation'
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

type StatusBadgeBaseProps = HTMLAttributes<HTMLSpanElement> & {
  /** Visible status label — required; color alone is never sufficient. */
  children: string
}

export type StatusBadgeProps = StatusBadgeBaseProps &
  (
    | (ContractStatusBinding & { variant?: never })
    | (VariantProps<typeof statusBadgeVariants> & { domain?: never; state?: never })
  )

/**
 * Shared status chip — text always present; not a decorative pill system.
 * Contract-backed usage: pass domain + state from `@/types/contracts`.
 * Visual-only usage remains for non-domain chrome; do not invent domain enums here.
 */
export function StatusBadge(props: StatusBadgeProps) {
  const { className, children, ...rest } = props
  const variant =
    'domain' in props && props.domain
      ? contractStatusVariant({ domain: props.domain, state: props.state } as ContractStatusBinding)
      : props.variant

  const spanProps = Object.fromEntries(
    Object.entries(rest).filter(
      ([key]) => key !== 'domain' && key !== 'state' && key !== 'variant',
    ),
  )

  return (
    <span className={cn(statusBadgeVariants({ variant }), className)} {...spanProps}>
      {children}
    </span>
  )
}

export { statusBadgeVariants }
