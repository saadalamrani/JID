import type { LucideIcon } from 'lucide-react'
import {
  Briefcase,
  CalendarDays,
  Handshake,
  Megaphone,
  UsersRound,
} from 'lucide-react'
import type { AnnouncementCategory } from '@/lib/validations/announcement'
import { cn } from '@/lib/utils'

/** Section 6.5 — exact Arabic labels and icons per category. */
export const CATEGORY_CONFIG: Record<
  AnnouncementCategory,
  { labelAr: string; Icon: LucideIcon; pillClassName: string }
> = {
  jobs: {
    labelAr: 'الوظائف',
    Icon: Briefcase,
    pillClassName: 'bg-emerald-900/35 text-emerald-50 border-emerald-200/30',
  },
  mentorship: {
    labelAr: 'الإرشاد',
    Icon: Handshake,
    pillClassName: 'bg-blue-900/35 text-blue-50 border-blue-200/30',
  },
  events: {
    labelAr: 'الفعاليات',
    Icon: CalendarDays,
    pillClassName: 'bg-violet-900/35 text-violet-50 border-violet-200/30',
  },
  platform: {
    labelAr: 'المنصة',
    Icon: Megaphone,
    pillClassName: 'bg-jid-olive/50 text-jid-beige border-jid-gold/35',
  },
  community: {
    labelAr: 'المجتمع',
    Icon: UsersRound,
    pillClassName: 'bg-amber-900/35 text-amber-50 border-amber-200/30',
  },
}

type CategoryPillProps = {
  category: AnnouncementCategory
  className?: string
}

export function CategoryPill({ category, className }: CategoryPillProps) {
  const config = CATEGORY_CONFIG[category]
  const Icon = config.Icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        config.pillClassName,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span>{config.labelAr}</span>
    </span>
  )
}
