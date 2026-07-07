'use client'

import { useTranslations } from 'next-intl'
import type { MentorHubKpis } from '@/lib/mentor-hub/queries'
import { cn } from '@/lib/utils'

type MentorKpiStripProps = {
  kpis: MentorHubKpis
  className?: string
}

export function MentorKpiStrip({ kpis, className }: MentorKpiStripProps) {
  const t = useTranslations('mentorship.hub.kpi')

  const items = [
    { label: t('pending'), value: String(kpis.pendingCount) },
    { label: t('activeChats'), value: String(kpis.activeChatsCount) },
    { label: t('upcomingMeetings'), value: String(kpis.upcomingMeetingsCount) },
    {
      label: t('rating'),
      value: kpis.ratingAvg != null ? kpis.ratingAvg.toFixed(1) : '—',
    },
  ]

  return (
    <section
      className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}
      aria-label={t('ariaLabel')}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-jid-line bg-white px-4 py-3 shadow-sm"
        >
          <p className="font-arabic text-xs text-jid-ink/50">{item.label}</p>
          <p className="mt-1 font-arabic text-2xl font-semibold text-jid-ink">{item.value}</p>
        </div>
      ))}
    </section>
  )
}
