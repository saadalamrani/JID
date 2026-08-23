'use client'

import { Briefcase, Building2, Landmark } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { OwnershipType } from '@/types/catalog'
import { cn } from '@/lib/utils'

type OwnershipBadgeProps = {
  type: OwnershipType
  className?: string
}

const BADGE_CONFIG: Record<OwnershipType, { icon: typeof Landmark; className: string }> = {
  government: {
    icon: Landmark,
    className: 'border-primary bg-primary text-primary-foreground',
  },
  semi_government: {
    icon: Building2,
    className: 'border-accent/40 bg-accent font-semibold text-primary shadow-sm',
  },
  private: {
    icon: Briefcase,
    className: 'border border-primary/25 bg-transparent text-primary',
  },
}

export function OwnershipBadge({ type, className }: OwnershipBadgeProps) {
  const t = useTranslations('filters')
  const config = BADGE_CONFIG[type]
  const label = t(`ownership.${type}`)
  const Icon = config.icon

  return (
    <span
      aria-label={`${t('ownershipGroupLabel')}: ${label}`}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
        config.className,
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {label}
    </span>
  )
}
