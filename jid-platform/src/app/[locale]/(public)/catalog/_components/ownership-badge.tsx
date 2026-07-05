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
    className: 'border-jid-olive bg-jid-olive text-jid-beige',
  },
  semi_government: {
    label: 'شبه حكومي',
    emoji: '👑',
    className:
      'border-jid-gold-200 bg-jid-gold font-semibold text-jid-olive-700 shadow-sm',
  },
  private: {
    label: 'قطاع خاص',
    emoji: '🏢',
    className: 'border border-jid-olive/30 bg-transparent text-jid-olive',
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
