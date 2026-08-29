'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { Button } from '@/components/ui/button'
import type { CareerItem } from '@/lib/career-operations/types'
import { careerItemTitle, formatRiyadhDate } from '@/lib/career-operations/display'

type CareerItemCardProps = {
  item: CareerItem
}

export function CareerItemCard({ item }: CareerItemCardProps) {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('radar.operations')
  const title = careerItemTitle(item, locale)
  const deadline = formatRiyadhDate(item.deadline_at, locale)
  const href = `/radar/${item.id}`

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {item.organization_name ? (
            <p className="text-sm text-muted-foreground">{item.organization_name}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {t(`states.${item.operational_state}`)}
            {item.source_class === 'GOVERNED_EXTERNAL' ? ` · ${t('externalTracked')}` : null}
          </p>
          {item.next_action && !item.next_action.completed_at ? (
            <p className="text-sm text-foreground">
              {t('nextAction')}: {item.next_action.label}
              {item.next_action.due_at
                ? ` — ${formatRiyadhDate(item.next_action.due_at, locale)}`
                : null}
            </p>
          ) : null}
          {deadline ? (
            <p className="text-sm text-muted-foreground">
              {t('deadline')}: {deadline}
            </p>
          ) : null}
        </div>
        <Button asChild variant="outline" size="sm" className="min-h-11 shrink-0">
          <Link href={href}>{t('openItem')}</Link>
        </Button>
      </div>
    </article>
  )
}
