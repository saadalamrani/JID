import { PendingReviewView } from '@/components/entity/pending-review-view'
import { getLatestVerificationForUser } from '@/lib/entity/claims'
import { resolveVerificationOutcome } from '@/lib/entity/verification-outcome'
import { fetchOwnerUniversityProfileRow } from '@/lib/profile/owner-university-profile'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/** Spec 05-B DEF-03 — load owned Profile (incl. suspended) before Spec §8 resolution. */
export default async function UniversityPendingReviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profileRow = await fetchOwnerUniversityProfileRow(supabase, user.id)
  const verification = await getLatestVerificationForUser(supabase, user.id, 'university')
  const outcome = resolveVerificationOutcome({
    orgType: 'university',
    authenticated: true,
    profile: profileRow ? { status: profileRow.status } : null,
    verification: verification
      ? {
          status: verification.status,
          resulting_profile_id: verification.resulting_profile_id,
        }
      : null,
  })

  if (outcome.kind !== 'pending' && outcome.kind !== 'needs_more_info') {
    redirect(outcome.path)
  }

  if (!verification) {
    redirect('/signup/entity-type')
  }

  return (
    <PendingReviewView
      claim={{
        id: verification.id,
        company_name: verification.company_name,
        business_email: verification.business_email,
        representative_name: verification.representative_name,
        status: verification.status,
        created_at: verification.created_at,
      }}
    />
  )
}
