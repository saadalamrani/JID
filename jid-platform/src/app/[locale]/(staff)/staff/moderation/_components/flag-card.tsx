'use client'

import { formatDistance } from 'date-fns'
import { arSA } from 'date-fns/locale'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { StaffFlagQueueItem } from '@/lib/staff/moderation-queries'

type FlagCardProps = {
  flag: StaffFlagQueueItem
}

export function FlagCard({ flag }: FlagCardProps) {
  const t = useTranslations('staff.moderation.card')
  const age = formatDistance(new Date(flag.created_at), new Date(), {
    addSuffix: true,
    locale: arSA,
  })

  return (
    <article className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-background/30">
      <Link href={`/staff/moderation/${flag.id}`} className="block space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {t(`targetTypes.${flag.target_type}`)}
          </span>
          <span className="text-xs text-muted-foreground">{age}</span>
        </div>
        <p className="font-medium text-foreground">{t(`reasons.${flag.reason}`)}</p>
        <p className="text-sm text-foreground/65">
          {t('reporter', { name: flag.reporter_name ?? t('unknownReporter') })}
        </p>
        {flag.details ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{flag.details}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">{flag.status}</p>
      </Link>
    </article>
  )
}
