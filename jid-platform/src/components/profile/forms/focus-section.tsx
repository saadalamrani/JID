'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type FocusSectionProps = {
  id: string
  title: string
  children: ReactNode
  className?: string
}

export function FocusSection({ id, title, children, className }: FocusSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow',
        className,
      )}
    >
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}
