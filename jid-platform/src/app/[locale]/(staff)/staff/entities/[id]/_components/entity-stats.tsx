import { getTranslations } from 'next-intl/server'
import { STAFF_COMMITMENT_FLAG_THRESHOLD } from '@/lib/staff/entity-constants'
import type { StaffEntityResponseStats } from '@/types/staff-entities'
import { cn } from '@/lib/utils'

type EntityStatsProps = {
  stats: StaffEntityResponseStats
}

export async function EntityStats({ stats }: EntityStatsProps) {
  const t = await getTranslations('staff.entities.detail.stats')
  const lowCommitment = stats.commitment_score < STAFF_COMMITMENT_FLAG_THRESHOLD

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
      {!stats.viewAvailable ? (
        <p className="mt-1 text-xs text-muted-foreground">{t('viewFallback')}</p>
      ) : null}

      {lowCommitment ? (
        <div
          role="alert"
          className="mt-4 rounded-md border border-sem-warning/30 bg-sem-warning/10 px-3 py-2 text-sm text-sem-warning"
        >
          {t('lowCommitmentWarning', {
            score: stats.commitment_score.toFixed(1),
            threshold: STAFF_COMMITMENT_FLAG_THRESHOLD,
          })}
        </div>
      ) : null}

      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">{t('commitmentScore')}</dt>
          <dd
            className={cn(
              'mt-1 text-lg font-semibold tabular-nums',
              lowCommitment ? 'text-destructive' : 'text-primary',
            )}
          >
            {stats.commitment_score.toFixed(1)}
          </dd>
        </div>
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
