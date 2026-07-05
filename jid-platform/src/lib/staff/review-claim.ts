import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

export type ReviewClaimInput = {
  claimId: string
  decision: 'approve' | 'reject'
  reviewNotes: string
  rejectionReason?: string
}

export async function reviewClaimRequest(supabase: Client, input: ReviewClaimInput) {
  const notes = input.reviewNotes.trim()
  if (!notes) {
    throw new Error('Review notes are required')
  }

  if (input.decision === 'reject' && !input.rejectionReason?.trim()) {
    throw new Error('Rejection reason is required')
  }

  const { error } = await supabase.rpc('review_claim_request', {
    p_claim_id: input.claimId,
    p_decision: input.decision,
    p_review_notes: notes,
    p_rejection_reason: input.rejectionReason?.trim() || undefined,
  })

  if (error) throw new Error(error.message)

  const fn = input.decision === 'approve' ? 'send-claim-approval' : 'send-claim-rejection'
  const { error: emailError } = await supabase.functions.invoke(fn, {
    body: { claimId: input.claimId },
  })

  if (emailError) {
    console.error('Claim decision email failed:', emailError.message)
  }
}
