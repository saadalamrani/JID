import { PendingReviewView } from '@/components/entity/pending-review-view'
import { getLatestVerificationForUser } from '@/lib/entity/claims'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const PENDING_STATUSES = ['pending_review', 'pending', 'under_review'] as const

export default async function CompanyVerificationPendingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const verification = await getLatestVerificationForUser(supabase, user.id)

  if (
    !verification ||
    verification.verification_type !== 'business' ||
    !PENDING_STATUSES.includes(verification.status as (typeof PENDING_STATUSES)[number])
  ) {
    if (verification?.status === 'rejected') {
      redirect('/company/verification-rejected')
    }
    if (verification?.status === 'approved' && !verification.resulting_profile_id) {
      redirect('/company/create-profile')
    }
    if (verification?.resulting_profile_id) {
      redirect('/company/dashboard')
    }
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
