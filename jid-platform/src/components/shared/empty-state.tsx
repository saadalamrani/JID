'use client'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { radius } from '@/lib/ui/consistency'
import { cn } from '@/lib/utils'

export const emptyStateIconClass = 'text-primary/30'
export const emptyStateIconSize = {
  page: 'h-12 w-12',
  inline: 'h-10 w-10',
  column: 'h-8 w-8',
} as const

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  children?: ReactNode
  /** page = full-width module empty; inline = dashed card; column = radar column */
  variant?: keyof typeof emptyStateIconSize
  className?: string
}

/** Part 7 — unified empty-state layout (icon, title, description, CTA slot). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  variant = 'page',
  className,
}: EmptyStateProps) {
  const isPage = variant === 'page'
  const isColumn = variant === 'column'

  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        isPage && 'justify-center px-4 py-16',
        variant === 'inline' &&
          cn(radius.xl, 'justify-center border border-dashed border-border bg-background/40 p-8'),
        isColumn &&
          cn(
            radius.lg,
            'min-h-[140px] justify-center border border-dashed border-border/80 bg-background/20 px-4 py-8',
          ),
        className,
      )}
    >
      <Icon
        className={cn(emptyStateIconSize[variant], emptyStateIconClass)}
        strokeWidth={1.25}
        aria-hidden
      />
      <h2
        className={cn(
          'font-arabic font-semibold text-foreground',
          isPage ? 'mt-6 text-xl' : isColumn ? 'mt-0 text-sm' : 'mt-4 text-lg',
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            'font-arabic text-muted-foreground',
            isPage ? 'mt-2 max-w-md text-sm' : isColumn ? 'mt-1 text-sm' : 'mx-auto mt-2 max-w-sm text-sm',
          )}
        >
          {description}
        </p>
      ) : null}
      {children ? <div className={cn('flex flex-col gap-3', isPage ? 'mt-6' : 'mt-4')}>{children}</div> : null}
    </div>
  )
}
