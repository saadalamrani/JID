'use client'

import type { RadarColumnId } from '@/lib/radar/column-config'
import { Link } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'

type EmptyColumnStateProps = {
  columnId: RadarColumnId
}

/**
 * Section 7.7 — per-column empty states with saved-column browse CTA.
 */
export function EmptyColumnState({ columnId }: EmptyColumnStateProps) {
  const t = useTranslations('radar.emptyColumn')

  return (
    <div className="flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-jid-line/80 bg-jid-beige/20 px-4 py-8 text-center">
      <p className="font-arabic text-sm text-jid-ink/60">{t(`${columnId}.message`)}</p>
      {columnId === 'saved' ? (
        <Link
          href="/opportunities"
          className="mt-3 font-arabic text-sm font-medium text-jid-olive underline-offset-2 hover:underline"
        >
          {t('saved.cta')}
        </Link>
      ) : null}
    </div>
  )
}
