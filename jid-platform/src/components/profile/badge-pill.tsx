import {
  Award,
  BadgeCheck,
  Building2,
  FileText,
  GraduationCap,
  Medal,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EarnedUserBadge } from '@/lib/profile/types'

const ICON_MAP: Record<string, LucideIcon> = {
  'badge-verified': BadgeCheck,
  'badge-cv': FileText,
  'badge-complete': Star,
  'badge-graduate': GraduationCap,
  'badge-partner': Building2,
  'badge-fast': Zap,
  'badge-entity': BadgeCheck,
  'badge-honor': Medal,
  'badge-mentor': Award,
  'badge-active': Sparkles,
  'badge-responsive': Zap,
  'badge-uni': GraduationCap,
  'badge-uni-verified': BadgeCheck,
  'badge-campus': Building2,
}

type BadgePillProps = {
  badge: Pick<EarnedUserBadge, 'slug' | 'name_ar' | 'name_en' | 'icon_key' | 'description_ar'>
  locale?: 'ar' | 'en'
  className?: string
}

export function BadgePill({ badge, locale = 'ar', className }: BadgePillProps) {
  const label = locale === 'en' ? badge.name_en : badge.name_ar
  const Icon = (badge.icon_key && ICON_MAP[badge.icon_key]) || Award

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/10 px-3 py-1 text-xs font-medium text-primary',
        className,
      )}
      title={badge.description_ar ?? undefined}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
      <span>{label}</span>
    </span>
  )
}
