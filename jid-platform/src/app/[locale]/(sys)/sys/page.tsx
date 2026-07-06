import { getTranslations } from 'next-intl/server'
import { AlertsBar } from '@/app/[locale]/(sys)/sys/dashboard/_components/alerts-bar'
import { ClaimsQueueWidget } from '@/app/[locale]/(sys)/sys/dashboard/_components/claims-queue-widget'
import { DashboardMetrics } from '@/app/[locale]/(sys)/sys/dashboard/_components/dashboard-metrics'
import { RecentActivity } from '@/app/[locale]/(sys)/sys/dashboard/_components/recent-activity'
import { SystemHealth } from '@/app/[locale]/(sys)/sys/dashboard/_components/system-health'
import {
  fetchDashboardMetrics,
  fetchPendingClaimsPreview,
  fetchRecentAuditActivity,
  fetchSystemHealth,
} from '@/lib/sys/dashboard-queries'

/** Matches mv_sys_dashboard_metrics cron refresh cadence (every 5 minutes). */
export const revalidate = 60

/** Section 6.1 — super admin dashboard landing page. */
export default async function SysDashboardPage() {
  const t = await getTranslations('sys.dashboard')

  const [metrics, claims, activity, health] = await Promise.all([
    fetchDashboardMetrics(),
    fetchPendingClaimsPreview(),
    fetchRecentAuditActivity(),
    fetchSystemHealth(),
  ])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-1 text-sm text-jid-ink/70">{t('subtitle')}</p>
      </header>

      <AlertsBar
        overdueClaims={metrics.overdue_claims}
        maintenanceMode={health.maintenance_mode}
        maintenanceMessage={health.maintenance_message}
        errorEventsLastHour={health.error_events_last_hour}
      />

      <DashboardMetrics metrics={metrics} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ClaimsQueueWidget claims={claims} />
        <RecentActivity events={activity} />
      </div>

      <SystemHealth health={health} />
    </div>
  )
}
