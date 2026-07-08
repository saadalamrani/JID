import { getTranslations } from 'next-intl/server'
import { StaffAnalyticsTracker } from '@/components/staff/staff-analytics-tracker'
import { AssignedClaims } from './dashboard/_components/assigned-claims'
import { OpenFlagsWidget } from './dashboard/_components/open-flags-widget'
import { PersonalMetrics } from './dashboard/_components/personal-metrics'
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

      <PersonalMetrics metrics={metrics} />

      <OpenFlagsWidget count={openFlagsCount} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AssignedClaims claims={assignedClaims} />
        <UnassignedQueue claims={unassignedClaims} />
      </div>

      <RecentActionsFeed actions={recentActions} />
    </div>
  )
}
