'use server'

import { revalidatePath } from 'next/cache'
import { PRIVILEGED_STAFF_ROLES, type UserRole } from '@/lib/auth/rbac'
import { trackServer } from '@/lib/analytics/server'
import { notifyClaimDecision } from '@/lib/staff/notify-claim-decision'
import {
  CLAIM_REVIEW_RPC_DECISION,
  reviewClaimSchema,
  type ReviewClaimInput,
} from '@/lib/validations/staff'
import { createClient } from '@/lib/supabase/server'

export type ReviewClaimActionResult = { ok: true } | { ok: false; error: string }

type StaffActor = { ok: true; userId: string } | { ok: false; error: string }

async function requireStaffActor(): Promise<StaffActor> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Authentication required' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role as UserRole | undefined
  if (!role || !(PRIVILEGED_STAFF_ROLES as readonly string[]).includes(role)) {
    return { ok: false, error: 'Only staff can review claims' }
  }

  return { ok: true, userId: user.id }
}

function revalidateClaimPaths(claimId: string) {
  revalidatePath('/staff/claims')
  revalidatePath('/staff')
  revalidatePath(`/staff/claims/${claimId}`)
  revalidatePath('/staff/claims/my-queue')
  revalidatePath('/staff/claims/history')
}

/** Section 7.7 — review claim via review_claim RPC with Zod validation. */
export async function reviewClaim(input: ReviewClaimInput): Promise<ReviewClaimActionResult> {
  const actor = await requireStaffActor()
  if (!actor.ok) return { ok: false, error: actor.error }

  const parsed = reviewClaimSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid review payload'
    return { ok: false, error: message }
  }

  const { claimId, decision, reason, requiredDocuments } = parsed.data
  const rpcDecision = CLAIM_REVIEW_RPC_DECISION[decision]

  const supabase = await createClient()

  const { data: verification } = await supabase
    .from('verification_requests')
    .select('applicant_user_id')
    .eq('id', claimId)
    .maybeSingle()

  if (!verification) return { ok: false, error: 'Verification request not found' }
  if (verification.applicant_user_id === actor.userId) {
    return { ok: false, error: 'Cannot review your own verification request' }
  }

  const { error } = await supabase.rpc('review_claim', {
    p_claim_id: claimId,
    p_decision: rpcDecision,
    p_reason: reason,
    p_required_documents:
      rpcDecision === 'reject' ? (requiredDocuments ?? []) : undefined,
  })

  if (error) return { ok: false, error: error.message }

  await notifyClaimDecision(supabase, { claimId, decision: rpcDecision })
  await trackServer('staff.claim_reviewed', actor.userId, {
    claim_id: claimId,
    decision: rpcDecision,
  })
  revalidateClaimPaths(claimId)

  return { ok: true }
}
