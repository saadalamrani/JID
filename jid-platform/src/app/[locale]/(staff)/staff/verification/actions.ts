'use server'

import { revalidatePath } from 'next/cache'
import { PRIVILEGED_STAFF_ROLES, type UserRole } from '@/lib/auth/rbac'
import {
  approveVerificationRequest,
  rejectVerificationRequest,
} from '@/lib/auth/verification'
import { trackServer } from '@/lib/analytics/server'
import { notifyClaimDecision } from '@/lib/staff/notify-claim-decision'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export type ReviewVerificationActionResult = { ok: true } | { ok: false; error: string }

const reviewVerificationSchema = z.object({
  verificationId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().trim().min(10, 'Review notes must be at least 10 characters'),
  requiredDocuments: z
    .array(z.enum(['commercial_registry', 'domain_ownership_proof', 'authorization_letter']))
    .optional(),
})

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
    return { ok: false, error: 'Only staff can review verification requests' }
  }

  return { ok: true, userId: user.id }
}

function revalidateVerificationPaths(verificationId: string) {
  revalidatePath('/staff/verification')
  revalidatePath('/staff')
  revalidatePath(`/staff/verification/${verificationId}`)
  revalidatePath('/staff/verification/my-queue')
  revalidatePath('/staff/verification/history')
}

/** P-108 — approve/reject via P-102 verification RPCs (no companies-table writes). */
export async function reviewVerification(
  input: z.infer<typeof reviewVerificationSchema>,
): Promise<ReviewVerificationActionResult> {
  const actor = await requireStaffActor()
  if (!actor.ok) return { ok: false, error: actor.error }

  const parsed = reviewVerificationSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid review payload'
    return { ok: false, error: message }
  }

  const { verificationId, decision, reason, requiredDocuments } = parsed.data
  const supabase = await createClient()

  const { data: verification } = await supabase
    .from('verification_requests')
    .select('applicant_user_id')
    .eq('id', verificationId)
    .maybeSingle()

  if (!verification) return { ok: false, error: 'Verification request not found' }
  if (verification.applicant_user_id === actor.userId) {
    return { ok: false, error: 'Cannot review your own verification request' }
  }

  try {
    if (decision === 'approved') {
      await approveVerificationRequest(supabase, {
        verificationId,
        reviewNotes: reason,
      })
      await notifyClaimDecision(supabase, { claimId: verificationId, decision: 'approve' })
    } else {
      await rejectVerificationRequest(supabase, {
        verificationId,
        reviewNotes: reason,
        rejectionReason: reason,
        requiredDocuments,
      })
      await notifyClaimDecision(supabase, { claimId: verificationId, decision: 'reject' })
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Review failed' }
  }

  await trackServer('staff.claim_reviewed', actor.userId, {
    claim_id: verificationId,
    decision,
  })
  revalidateVerificationPaths(verificationId)

  return { ok: true }
}
