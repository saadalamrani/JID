'use client'

import { useTranslations } from 'next-intl'

export function DraftPublicationBoundary() {
  const t = useTranslations('organizationProfile.publicationBoundary')

  return (
    <div
      role="status"
      className="rounded-lg border border-accent/40 bg-background/80 px-4 py-3 text-sm text-foreground/80"
    >
      {t('message')}
    </div>
  )
}
