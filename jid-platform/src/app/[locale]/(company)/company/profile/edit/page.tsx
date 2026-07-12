import { notFound, redirect } from 'next/navigation'
import { ProfileEditWizard } from './_components/profile-edit-wizard'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchOwnerBusinessProfile } from '@/lib/profile/owner-business-profile'
import { createClient } from '@/lib/supabase/server'

export default async function CompanyProfileEditPage() {
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()
  const profile = await fetchOwnerBusinessProfile(supabase, userId)

  if (!profile) {
    redirect('/company/create-profile')
  }

  if (!profile.id) {
    notFound()
  }

  return <ProfileEditWizard profile={profile} />
}
