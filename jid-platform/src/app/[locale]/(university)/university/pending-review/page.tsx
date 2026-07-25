import { PendingReviewView } from '@/components/entity/pending-review-view'
import { getLatestVerificationForUser } from '@/lib/entity/claims'
import { resolveVerificationOutcome } from '@/lib/entity/verification-outcome'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UniversityPendingReviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const verification = await getLatestVerificationForUser(supabase, user.id, 'university')
  const outcome = resolveVerificationOutcome({
    orgType: 'university',
    authenticated: true,
    profile: null,
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
