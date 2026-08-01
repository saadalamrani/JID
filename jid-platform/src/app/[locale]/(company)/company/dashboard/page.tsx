import { OrganizationDraftDashboard } from '@/components/organization-profile/organization-draft-dashboard'
import { CompanyDashboard } from '@/app/[locale]/(company)/_components/company-dashboard'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchOrganizationDirectoryReference } from '@/lib/profile/organization-directory-reference'
import { fetchOwnerBusinessProfile } from '@/lib/profile/owner-business-profile'
import { fetchCompanyDashboardMetrics } from '@/lib/queries/company-dashboard-metrics'
import { createClient } from '@/lib/supabase/server'

/**
 * Spec 05-B / 08-B — Business dashboard only (owned business Profile).
 * University owners use the `(university)` dashboard route group.
 * Metrics: server-derived owner-scoped read-only counts (Profile ownership only).
 */
export default async function CompanyDashboardPage() {
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()

  const businessProfile = await fetchOwnerBusinessProfile(supabase, userId)

  if (businessProfile) {
    const directory = await fetchOrganizationDirectoryReference(
      supabase,
      businessProfile.directory_id,
    )

    if (directory && businessProfile.status === 'draft') {
      return (
        <OrganizationDraftDashboard
          orgKind="business"
          profile={businessProfile}
          directory={directory}
        />
      )
    }

    const metrics = await fetchCompanyDashboardMetrics(supabase, businessProfile.id)
    return <CompanyDashboard profile={businessProfile} metrics={metrics} />
  }

  return <CompanyDashboard profile={null} />
}
