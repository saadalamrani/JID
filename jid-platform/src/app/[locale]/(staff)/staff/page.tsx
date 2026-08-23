import { getTranslations } from 'next-intl/server'
import { StaffAnalyticsTracker } from '@/components/staff/staff-analytics-tracker'
import { AssignedClaims } from './dashboard/_components/assigned-claims'
import { OpenFlagsWidget } from './dashboard/_components/open-flags-widget'
import { PersonalMetricsLazy } from './dashboard/_components/personal-metrics-lazy'
import { RecentActionsFeed } from './dashboard/_components/recent-actions-feed'
import { UnassignedQueue } from './dashboard/_components/unassigned-queue'
import {
  fetchAssignedClaimsForStaff,
  fetchOpenFlagsCount,
  fetchStaffPersonalMetrics,
  fetchStaffRecentActions,
  fetchUnassignedClaims,
} from '@/lib/staff/dashboard-queries'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'

export const revalidate = 60

/** Section 6.1 — personal staff dashboard landing page. */
export default async function StaffHomePage() {
  const t = await getTranslations('staff.dashboard')
  const profile = await requireStaffShellAccess()

  const [metrics, assignedClaims, unassignedClaims, recentActions, openFlagsCount] =
    await Promise.all([
      fetchStaffPersonalMetrics(profile.id),
      fetchAssignedClaimsForStaff(profile.id),
      fetchUnassignedClaims(),
      fetchStaffRecentActions(profile.id),
      fetchOpenFlagsCount(),
    ])

  return (
    <div className="space-y-6">
      <StaffAnalyticsTracker event="staff.dashboard_viewed" />
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      {/* Section 12/36 — attention/queue first, personal metrics demoted below:
          a five-tile stat row (several reading 0 for accounts with no activity
          yet) rendering above the actual work queue is exactly the "decorative
          KPI wall" anti-pattern; the assigned/unassigned queues are what a
          reviewer needs first. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AssignedClaims claims={assignedClaims} />
        <UnassignedQueue claims={unassignedClaims} />
      </div>

      <OpenFlagsWidget count={openFlagsCount} />

      <PersonalMetricsLazy metrics={metrics} />

      <RecentActionsFeed actions={recentActions} />
    </div>
  )
}
