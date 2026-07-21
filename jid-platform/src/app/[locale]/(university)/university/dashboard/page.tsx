import { OrganizationDraftDashboard } from '@/components/organization-profile/organization-draft-dashboard'
import { UniversityDashboard } from '@/app/[locale]/(company)/_components/university-dashboard'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchOrganizationDirectoryReference } from '@/lib/profile/organization-directory-reference'
import { fetchOwnerUniversityProfile } from '@/lib/profile/owner-university-profile'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UniversityDashboardPage() {
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()

  const universityProfile = await fetchOwnerUniversityProfile(supabase, userId)

  if (!universityProfile) {
    redirect('/university/create-profile')
  }

  const directory = await fetchOrganizationDirectoryReference(
    supabase,
    universityProfile.directory_id,
  )

  if (directory && universityProfile.status === 'draft') {
    return (
      <OrganizationDraftDashboard
        orgKind="university"
        profile={universityProfile}
        directory={directory}
      />
    )
  }

  return <UniversityDashboard />
}
