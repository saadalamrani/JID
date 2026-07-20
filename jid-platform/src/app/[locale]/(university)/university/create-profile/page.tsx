import { UniversityProfileCreationWizard } from './_components/university-profile-creation-wizard'
import { getMyApprovedVerifications } from '@/lib/auth/verification'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CreateUniversityProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const approved = await getMyApprovedVerifications(supabase)
  const universityApproved = approved.filter((row) => row.verification_type === 'university')

  if (universityApproved.length === 0) {
    redirect('/university/pending-review')
  }

  const verification = universityApproved[0]!

  if (verification.resulting_profile_id) {
    redirect('/university/dashboard')
  }

  const { data: directoryRow } = await supabase
    .from('companies')
    .select('id, name, name_ar')
    .eq('id', verification.directory_id)
    .maybeSingle()

  return (
    <UniversityProfileCreationWizard
      verificationId={verification.id}
      directoryNameAr={directoryRow?.name_ar ?? directoryRow?.name ?? verification.company_name}
      suggestedDisplayNameAr={directoryRow?.name_ar ?? verification.company_name}
    />
  )
}
