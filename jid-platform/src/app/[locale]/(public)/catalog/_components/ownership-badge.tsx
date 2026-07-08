import type { OwnershipType } from '@/types/catalog'
import { cn } from '@/lib/utils'

type OwnershipBadgeProps = {
  type: OwnershipType
  className?: string
}

const BADGE_CONFIG: Record<
  OwnershipType,
  { label: string; emoji: string; className: string }
> = {
  government: {
    label: 'حكومي',
    emoji: '🏛️',
    className: 'border-primary bg-primary text-primary-foreground',
  },
  semi_government: {
    label: 'شبه حكومي',
    emoji: '👑',
    className:
      'border-accent/40 bg-accent font-semibold text-primary shadow-sm',
  },
  private: {
    label: 'قطاع خاص',
    emoji: '🏢',
    className: 'border border-primary/25 bg-transparent text-primary',
  },
}

export function OwnershipBadge({ type, className }: OwnershipBadgeProps) {
  const config = BADGE_CONFIG[type]

  return (
    <span
      aria-label={`نوع الملكية: ${config.label}`}
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-arabic text-xs',
        config.className,
        className,
      )}
    >
      <span aria-hidden>{config.emoji}</span>
      {config.label}
    </span>
  )
}
