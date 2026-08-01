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
        'inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium',
        status === 'draft' && 'border-jid-gold/40 bg-jid-beige text-foreground',
        status === 'published' && 'border-primary/20 bg-primary/10 text-primary',
        status === 'suspended' && 'border-destructive/30 bg-destructive/5 text-destructive',
        status !== 'draft' &&
          status !== 'published' &&
          status !== 'suspended' &&
          'border-border bg-background text-muted-foreground',
      )}
    >
      <span aria-hidden className="text-[0.65rem]">
        {status === 'draft' ? '●' : status === 'suspended' ? '⏸' : '✓'}
      </span>
      <span>{label}</span>
    </span>
  )
}
