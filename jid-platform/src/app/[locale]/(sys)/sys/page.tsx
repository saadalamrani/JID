import { getTranslations } from 'next-intl/server'
import { SysAnalyticsTracker } from '@/components/sys/sys-analytics-tracker'
import { AlertsBar } from '@/app/[locale]/(sys)/sys/dashboard/_components/alerts-bar'
import { VerificationQueueWidget } from '@/app/[locale]/(sys)/sys/dashboard/_components/verification-queue-widget'
import { DashboardMetricsLazy } from '@/app/[locale]/(sys)/sys/dashboard/_components/dashboard-metrics-lazy'
import { RecentActivity } from '@/app/[locale]/(sys)/sys/dashboard/_components/recent-activity'
import { SystemHealth } from '@/app/[locale]/(sys)/sys/dashboard/_components/system-health'
import {
  fetchDashboardMetrics,
  fetchPendingVerificationsPreview,
  fetchRecentAuditActivity,
  fetchSystemHealth,
} from '@/lib/sys/dashboard-queries'

/** Matches mv_sys_dashboard_metrics cron refresh cadence (every 5 minutes). */
export const revalidate = 60

/** Section 6.1 — super admin dashboard landing page. */
export default async function SysDashboardPage() {
  const t = await getTranslations('sys.dashboard')

  const [metrics, pendingVerifications, activity, health] = await Promise.all([
    fetchDashboardMetrics(),
    fetchPendingVerificationsPreview(),
    fetchRecentAuditActivity(),
    fetchSystemHealth(),
  ])

  return (
    <div className="space-y-6">
      <SysAnalyticsTracker event="sys.dashboard_viewed" />
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <AlertsBar
        overdueClaims={metrics.overdue_claims}
        maintenanceMode={health.maintenance_mode}
        maintenanceMessage={health.maintenance_message}
        errorEventsLastHour={health.error_events_last_hour}
      />

      <DashboardMetricsLazy metrics={metrics} />

      <div className="grid gap-6 lg:grid-cols-2">
        <VerificationQueueWidget items={pendingVerifications} />
        <RecentActivity events={activity} />
      </div>

      <SystemHealth health={health} />
    </div>
  )
}
