import { OrganizationDraftDashboard } from '@/components/organization-profile/organization-draft-dashboard'
import { CompanyDashboard } from '@/app/[locale]/(company)/_components/company-dashboard'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchOrganizationDirectoryReference } from '@/lib/profile/organization-directory-reference'
import { fetchOwnerBusinessProfile } from '@/lib/profile/owner-business-profile'
import { createClient } from '@/lib/supabase/server'

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

    return <CompanyDashboard profile={businessProfile} />
  }

  return <CompanyDashboard profile={null} />
}
