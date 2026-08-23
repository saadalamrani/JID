'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { OpportunityTier } from '@/lib/monetization/types'

type TierBadgeProps = {
  tier: OpportunityTier
  className?: string
}

/**
 * Universal opportunity tier badge (Prompt 0).
 * Every opportunity card carries exactly one: Standard | Plus.
 */
export function TierBadge({ tier, className }: TierBadgeProps) {
  const t = useTranslations('monetization.tier')
  const label = t(tier === 'plus' ? 'plus' : 'normal')

  if (tier === 'plus') {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold',
          'bg-accent text-primary',
          className,
        )}
        aria-label={label}
      >
        {label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border border-border bg-transparent px-2 py-0.5 text-xs font-medium text-muted-foreground',
        className,
      )}
      aria-label={label}
    >
      {label}
    </span>
  )
}
