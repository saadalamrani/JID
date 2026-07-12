'use client'

import { Clock, CheckCircle2, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { MentorResponseStats } from '@/lib/mentor/response-stats'
import { cn } from '@/lib/utils'

type MentorResponseStatsProps = {
  stats: MentorResponseStats
  className?: string
  /** i18n namespace — `profile.mentor.public` or `mentorship.detail` */
  namespace?: 'profile.mentor.public' | 'mentorship.detail'
}

export function MentorResponseStatsSection({
  stats,
  className,
  namespace = 'profile.mentor.public',
}: MentorResponseStatsProps) {
  const t = useTranslations(namespace)

  const cards = [
    stats.avg_response_hours != null
      ? {
          key: 'avg_response_hours',
          icon: Clock,
          label: t('avgResponseHoursLabel'),
          value: t('avgResponseHoursValue', { hours: stats.avg_response_hours }),
        }
      : null,
    stats.acceptance_rate_pct != null
      ? {
          key: 'acceptance_rate_pct',
          icon: CheckCircle2,
          label: t('acceptanceRateLabel'),
          value: t('acceptanceRateValue', { pct: stats.acceptance_rate_pct }),
        }
      : null,
    stats.completed_sessions != null
      ? {
          key: 'completed_sessions',
          icon: Users,
          label: t('completedSessionsLabel'),
          value: t('completedSessionsValue', { count: stats.completed_sessions }),
        }
      : null,
  ].filter((card): card is NonNullable<typeof card> => card != null)

  if (cards.length === 0) return null

  return (
    <section
      className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}
      aria-label={t('responseStatsAria')}
    >
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.key}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-primary">
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <h2 className="text-sm font-medium text-muted-foreground">{card.label}</h2>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{card.value}</p>
          </div>
        )
      })}
    </section>
  )
}
