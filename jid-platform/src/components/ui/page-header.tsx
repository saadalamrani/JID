import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type PageHeaderProps = HTMLAttributes<HTMLElement> & {
  title: string
  description?: string
  /** Optional back control or breadcrumb trail (logical start). */
  breadcrumb?: ReactNode
  /** Optional primary actions (logical end). */
  actions?: ReactNode
}

/**
 * Shared page title band — compositional only.
 * Does not hard-code domain copy or routes. Consumers are not migrated in Wave A.
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1 space-y-2">
        {breadcrumb ? <div className="text-sm text-muted-foreground">{breadcrumb}</div> : null}
        <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
      ) : null}
    </header>
  )
}
