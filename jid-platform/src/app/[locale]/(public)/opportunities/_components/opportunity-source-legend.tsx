'use client'

import { useTranslations } from 'next-intl'

/**
 * Honest native vs external provenance legend for Opportunity discovery.
 * No scores, match %, or recommendation claims.
 */
export function OpportunitySourceLegend() {
  const t = useTranslations('opportunities.legend')

  return (
    <aside
      aria-label={t('ariaLabel')}
      className="mb-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
    >
      <p className="font-arabic text-foreground">{t('title')}</p>
      <ul className="mt-2 list-disc space-y-1 ps-5 font-arabic">
        <li>{t('native')}</li>
        <li>{t('external')}</li>
        <li>{t('noMatchPercent')}</li>
      </ul>
    </aside>
  )
}
