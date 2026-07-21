'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type ProfileStateBadgeProps = {
  status: string
}

export function ProfileStateBadge({ status }: ProfileStateBadgeProps) {
  const t = useTranslations('organizationProfile.state')

  const label = t(status, { defaultValue: status })

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium',
        status === 'draft' && 'border-amber-200 bg-amber-50 text-amber-900',
        status === 'published' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
        status === 'suspended' && 'border-red-200 bg-red-50 text-red-900',
        status !== 'draft' && status !== 'published' && status !== 'suspended' &&
          'border-border bg-background text-foreground/70',
      )}
    >
      <span aria-hidden>{status === 'draft' ? '●' : status === 'suspended' ? '⏸' : '✓'}</span>
      {label}
    </span>
  )
}
