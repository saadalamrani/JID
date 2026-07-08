'use client'

import { GraduationCap } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type EmptyEntryStateProps = {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  isLoading?: boolean
  icon?: ReactNode
}

/** Section 7.7 — zero-entries placeholder with primary CTA. */
export function EmptyEntryState({
  title,
  description,
  actionLabel,
  onAction,
  isLoading = false,
  icon,
}: EmptyEntryStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background/20 px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted-foreground">
        {icon ?? <GraduationCap className="h-6 w-6" aria-hidden />}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-xs text-foreground/55">{description}</p>
      <Button type="button" className="mt-5" onClick={onAction} disabled={isLoading}>
        {actionLabel}
      </Button>
    </div>
  )
}
