'use client'

import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'

/** Visual shell for zero-completion profiles (Section 6.3 empty state). */
export function ProfileEmptyState() {
  const t = useTranslations('profile.public')

  return (
    <div className="rounded-xl border border-dashed border-border bg-background/40 p-8 text-center">
      <Sparkles className="mx-auto h-10 w-10 text-accent" aria-hidden />
      <h2 className="mt-4 text-lg font-semibold text-foreground">{t('emptyStateTitle')}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{t('emptyStateMessage')}</p>
    </div>
  )
}
