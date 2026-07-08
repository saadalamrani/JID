'use client'

import type { RadarColumnId } from '@/lib/radar/column-config'
import { Link } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Inbox } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'

type EmptyColumnStateProps = {
  columnId: RadarColumnId
}

/** Section 7.7 — per-column empty states with saved-column browse CTA. */
export function EmptyColumnState({ columnId }: EmptyColumnStateProps) {
  const t = useTranslations('radar.emptyColumn')

  return (
    <EmptyState
      icon={Inbox}
      variant="column"
      title={t(`${columnId}.message`)}
      className="[&_h2]:font-normal"
    >
      {columnId === 'saved' ? (
        <Link
          href="/opportunities"
          className="font-arabic text-sm font-medium text-primary underline-offset-2 transition-colors duration-fast hover:underline"
        >
          {t('saved.cta')}
        </Link>
      ) : null}
    </EmptyState>
  )
}
