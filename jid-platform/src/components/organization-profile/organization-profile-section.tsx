import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type OrganizationProfilePanelProps = {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

/** Spec 08-D — flat section card for owner Profile management. */
export function OrganizationProfilePanel({
  title,
  description,
  children,
  className,
}: OrganizationProfilePanelProps) {
  return (
    <section className={cn('rounded-lg border border-border bg-card p-5 sm:p-6', className)}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
