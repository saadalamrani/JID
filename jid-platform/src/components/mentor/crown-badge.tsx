'use client'

import { Crown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type CrownBadgeProps = {
  className?: string
}

/** Section 4.4 — renders only when mentor.is_mentor_of_month === true. */
export function CrownBadge({ className }: CrownBadgeProps) {
  const t = useTranslations('mentorship.card')

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-accent/80 to-accent px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm',
        className,
      )}
      title={t('mentorOfMonth')}
    >
      <Crown className="h-3 w-3 shrink-0" aria-hidden />
      <span className="font-arabic">{t('mentorOfMonth')}</span>
    </span>
  )
}
