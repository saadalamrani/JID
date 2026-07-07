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
    <article className="rounded-lg border border-jid-line bg-white p-4 transition-colors hover:bg-jid-beige/30">
      <Link href={`/staff/moderation/${flag.id}`} className="block space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-jid-olive/10 px-2 py-0.5 text-xs font-medium text-jid-olive">
            {t(`targetTypes.${flag.target_type}`)}
          </span>
          <span className="text-xs text-jid-ink/50">{age}</span>
        </div>
        <p className="font-medium text-jid-ink">{t(`reasons.${flag.reason}`)}</p>
        <p className="text-sm text-jid-ink/65">
          {t('reporter', { name: flag.reporter_name ?? t('unknownReporter') })}
        </p>
        {flag.details ? (
          <p className="line-clamp-2 text-sm text-jid-ink/55">{flag.details}</p>
        ) : null}
        <p className="text-xs text-jid-ink/40">{flag.status}</p>
      </Link>
    </article>
  )
}
