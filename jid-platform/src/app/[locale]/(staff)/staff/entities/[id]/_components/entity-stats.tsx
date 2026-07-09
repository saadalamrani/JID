import { getTranslations } from 'next-intl/server'
import type { StaffEntityResponseStats } from '@/types/staff-entities'

type EntityStatsProps = {
  stats: StaffEntityResponseStats
}

export async function EntityStats({ stats }: EntityStatsProps) {
  const t = await getTranslations('staff.entities.detail.stats')

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
      {!stats.viewAvailable ? (
        <p className="mt-1 text-xs text-muted-foreground">{t('viewFallback')}</p>
      ) : null}

      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">{t('responseRate')}</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {stats.response_rate_pct != null ? `${stats.response_rate_pct}%` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('avgResponseDays')}</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {stats.avg_response_days != null ? stats.avg_response_days : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('jobs12mo')}</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {stats.total_jobs_posted_12mo}
          </dd>
        </div>
      </dl>
    </section>
  )
}
