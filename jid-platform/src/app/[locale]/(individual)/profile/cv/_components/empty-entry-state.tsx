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
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-jid-line bg-jid-beige/20 px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-jid-beige text-jid-ink/50">
        {icon ?? <GraduationCap className="h-6 w-6" aria-hidden />}
      </div>
      <p className="text-sm font-medium text-jid-ink/80">{title}</p>
      <p className="mt-2 max-w-sm text-xs text-jid-ink/55">{description}</p>
      <Button type="button" className="mt-5" onClick={onAction} disabled={isLoading}>
        {actionLabel}
      </Button>
    </div>
  )
}
