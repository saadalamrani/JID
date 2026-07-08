'use client'

import { useTranslations } from 'next-intl'
import { useMentorFilters } from './mentor-filter-context'

export function MentorDiscoveryHero() {
  const t = useTranslations('mentorship.discovery.hero')
  const { stats, isFetching } = useMentorFilters()

  const mentorsFormatted = stats.activeMentorCount.toLocaleString('ar-SA')
  const sessionsFormatted = stats.totalSessionsCount.toLocaleString('ar-SA')

  return (
    <header className="space-y-3 pb-6">
      <h1 className="font-arabic text-3xl font-semibold text-foreground">{t('title')}</h1>
      <p className="font-arabic text-sm text-muted-foreground">{t('subtitle')}</p>
      <dl className="flex flex-wrap gap-4 font-arabic text-sm">
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <dt className="text-muted-foreground">{t('activeMentors')}</dt>
          <dd className="mt-1 text-xl font-semibold text-primary">
            {isFetching ? (
              <span className="inline-block h-6 w-12 animate-pulse rounded bg-jid-line/30" />
            ) : (
              mentorsFormatted
            )}
          </dd>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <dt className="text-muted-foreground">{t('totalSessions')}</dt>
          <dd className="mt-1 text-xl font-semibold text-primary">
            {isFetching ? (
              <span className="inline-block h-6 w-12 animate-pulse rounded bg-jid-line/30" />
            ) : (
              sessionsFormatted
            )}
          </dd>
        </div>
      </dl>
    </header>
  )
}
