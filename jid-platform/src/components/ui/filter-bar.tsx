import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type FilterBarProps = HTMLAttributes<HTMLElement> & {
  /** Primary search control slot. */
  search?: ReactNode
  /** Filter controls slot (selects, chips, toggles). */
  filters?: ReactNode
  /** Optional trailing actions (clear, apply) — logical end. */
  actions?: ReactNode
  /** Extra compositional children below the primary row. */
  children?: ReactNode
  /** Accessible name for the filter landmark. */
  'aria-label': string
}

/**
 * Domain-agnostic filter layout wrapper.
 * Does not create a second filter system — StickyFilterBar and other
 * domain wrappers remain; migrate consumers in a later wave only.
 */
export function FilterBar({
  search,
  filters,
  actions,
  children,
  className,
  'aria-label': ariaLabel,
  ...props
}: FilterBarProps) {
  return (
    <section
      role="search"
      aria-label={ariaLabel}
      className={cn('flex flex-col gap-3 border-b border-border bg-background py-3', className)}
      {...props}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        {search ? <div className="min-w-0 flex-1">{search}</div> : null}
        {filters ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2 md:shrink-0">{filters}</div>
        ) : null}
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 md:ms-auto md:shrink-0">{actions}</div>
        ) : null}
      </div>
      {children}
    </section>
  )
}
