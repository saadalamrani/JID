import { PendingReviewView } from '@/components/entity/pending-review-view'
import { getLatestVerificationForUser } from '@/lib/entity/claims'
import { resolveVerificationOutcome } from '@/lib/entity/verification-outcome'
import { fetchOwnerBusinessProfileRow } from '@/lib/profile/owner-business-profile'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/** Spec 04-B DEF-08 — load owned Profile (incl. suspended) before Spec §8 resolution. */
export default async function CompanyVerificationPendingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profileRow = await fetchOwnerBusinessProfileRow(supabase, user.id)
  const verification = await getLatestVerificationForUser(supabase, user.id, 'business')
  const outcome = resolveVerificationOutcome({
    orgType: 'business',
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
        claimant_name: verification.claimant_name,
        status: verification.status,
        created_at: verification.created_at,
      }}
    />
  )
}
