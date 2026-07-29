import { UniversityProfileCreationWizard } from './_components/university-profile-creation-wizard'
import { ApprovedWithoutProfileNotice } from './_components/approved-without-profile-notice'
import { getLatestVerificationForUser } from '@/lib/entity/claims'
import { resolveUniversityCreateProfileGate } from '@/lib/entity/university-create-profile-gate'
import { fetchOwnerUniversityProfileRow } from '@/lib/profile/owner-university-profile'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Spec 05-B DEF-01 / DEF-02 —
 * Profile-first gate; Spec §8 outcome when no Profile; orphaned resulting_profile_id stays on wizard.
 */
export default async function CreateUniversityProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profileRow = await fetchOwnerUniversityProfileRow(supabase, user.id)
  const verification = await getLatestVerificationForUser(supabase, user.id, 'university')

  const gate = resolveUniversityCreateProfileGate({
    profile: profileRow ? { status: profileRow.status } : null,
    verification: verification
      ? {
          status: verification.status,
          resulting_profile_id: verification.resulting_profile_id,
        }
      : null,
  })

  if (gate.action === 'redirect') {
    redirect(gate.path)
  }

  if (!verification || verification.status !== 'approved') {
    redirect('/signup/entity-type')
  }

  const { data: directoryRow } = await supabase
    .from('companies')
    .select('id, name, name_ar')
    .eq('id', verification.directory_id)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ApprovedWithoutProfileNotice actor="university" />
      <UniversityProfileCreationWizard
        verificationId={verification.id}
        directoryNameAr={directoryRow?.name_ar ?? directoryRow?.name ?? verification.company_name}
        suggestedDisplayNameAr={directoryRow?.name_ar ?? verification.company_name}
      />
    </div>
  )
}
