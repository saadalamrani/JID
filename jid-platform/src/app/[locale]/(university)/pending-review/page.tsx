import { PendingReviewView } from '@/components/entity/pending-review-view'
import { getLatestClaimForUser } from '@/lib/entity/claims'
import { redirect } from '@/lib/i18n/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function UniversityPendingReviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const claim = await getLatestClaimForUser(supabase, user.id)

  if (!claim || !['pending_review', 'pending', 'under_review'].includes(claim.status)) {
    redirect('/signup/entity-type')
  }

  return (
    <PendingReviewView
      claim={{
        id: claim.id,
        company_name: claim.company_name,
        business_email: claim.business_email,
        claimant_name: claim.claimant_name,
        status: claim.status,
        created_at: claim.created_at,
      }}
    />
  )
}
