'use client'

import { Sparkles } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { ParsedActiveWorkshop } from '@/lib/mentor/workshop'
import { cn } from '@/lib/utils'

type WorkshopChipProps = {
  workshop: ParsedActiveWorkshop
  className?: string
}

/** Section 4.5 — gold gradient chip for live upcoming workshops. */
export function WorkshopChip({ workshop, className }: WorkshopChipProps) {
  const t = useTranslations('mentorship.card')
  const locale = useLocale()
  const title = locale === 'ar' && workshop.title_ar ? workshop.title_ar : workshop.title

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full bg-gradient-to-r from-accent/60 via-accent to-accent/90 px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-sm',
        className,
      )}
    >
      <Sparkles className="h-3 w-3 shrink-0 text-primary" aria-hidden />
      <span className="truncate font-arabic">{t('workshopChip', { title })}</span>
    </span>
  )
}
