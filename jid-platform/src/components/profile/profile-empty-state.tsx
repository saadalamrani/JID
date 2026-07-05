'use client'

import { Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'

/** Visual shell for zero-completion profiles (Section 6.3 empty state). */
export function ProfileEmptyState() {
  const t = useTranslations('profile.public')

  return (
    <div className="rounded-xl border border-dashed border-jid-line bg-jid-beige/40 p-8 text-center">
      <Sparkles className="mx-auto h-10 w-10 text-jid-gold" aria-hidden />
      <h2 className="mt-4 text-lg font-semibold text-jid-ink">{t('emptyStateTitle')}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-jid-ink/60">{t('emptyStateMessage')}</p>
    </div>
  )
}
