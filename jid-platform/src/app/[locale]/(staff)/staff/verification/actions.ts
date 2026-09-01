'use server'

import { revalidatePath } from 'next/cache'
import type { UserRole } from '@/lib/auth/rbac'
import {
  approveVerificationRequest,
  approveVerificationRequestOverride,
  createDirectoryForVerification,
  linkVerificationDirectory,
  markVerificationNeedsReconciliation,
  rejectVerificationRequest,
  rejectVerificationRequestOverride,
} from '@/lib/auth/verification'
import { trackServer } from '@/lib/analytics/server'
import { notifyVerificationDecision } from '@/lib/staff/notify-verification-decision'
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
  /** Explicit Super Admin override only; absent/false means normal RPC path. */
  overrideAssignment: z.boolean().optional(),
})

type DecisionActor =
  | { ok: true; userId: string; role: 'staff' | 'super_admin' }
  | { ok: false; error: string }

/**
 * Spec 02-B — decision authorization derives role fresh from profiles.role.
 * Do NOT use PRIVILEGED_STAFF_ROLES here: it includes admin, who must never
 * reach a decision RPC (normal or override).
 */
async function requireDecisionActor(): Promise<DecisionActor> {
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

  if (role === 'admin') {
    return { ok: false, error: 'Admin cannot decide verification requests' }
  }

  if (role !== 'staff' && role !== 'super_admin') {
    return { ok: false, error: 'Only staff can review verification requests' }
  }

  return { ok: true, userId: user.id, role }
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
  const actor = await requireDecisionActor()
  if (!actor.ok) return { ok: false, error: actor.error }

  const parsed = reviewVerificationSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid review payload'
    return { ok: false, error: message }
  }

  const { verificationId, decision, reason, requiredDocuments, overrideAssignment } = parsed.data
  const supabase = await createClient()

  const { data: verification } = await supabase
    .from('verification_requests')
    .select('applicant_user_id')
    .eq('id', verificationId)
    .maybeSingle()

  if (!verification) return { ok: false, error: 'Verification request not found' }

  // Self-review denied for every role (including overriding super_admin) before RPC selection.
  if (verification.applicant_user_id === actor.userId) {
    return { ok: false, error: 'Cannot review your own verification request' }
  }

  const useOverride = actor.role === 'super_admin' && overrideAssignment === true

  try {
    if (decision === 'approved') {
      if (useOverride) {
        await approveVerificationRequestOverride(supabase, {
          verificationId,
          reviewNotes: reason,
        })
      } else {
        await approveVerificationRequest(supabase, {
          verificationId,
          reviewNotes: reason,
        })
      }
      await notifyVerificationDecision(supabase, { verificationId, decision: 'approve' })
    } else if (useOverride) {
      await rejectVerificationRequestOverride(supabase, {
        verificationId,
        reviewNotes: reason,
        rejectionReason: reason,
        requiredDocuments,
      })
      await notifyVerificationDecision(supabase, { verificationId, decision: 'reject' })
    } else {
      await rejectVerificationRequest(supabase, {
        verificationId,
        reviewNotes: reason,
        rejectionReason: reason,
        requiredDocuments,
      })
      await notifyVerificationDecision(supabase, { verificationId, decision: 'reject' })
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Review failed' }
  }

  await trackServer('staff.verification_reviewed', actor.userId, {
    verification_id: verificationId,
    decision,
  })
  revalidateVerificationPaths(verificationId)

  return { ok: true }
}

export async function reconcileVerificationDirectory(input: {
  verificationId: string
  directoryId: string
}): Promise<ReviewVerificationActionResult> {
  const actor = await requireDecisionActor()
  if (!actor.ok) return { ok: false, error: actor.error }

  const parsed = z
    .object({
      verificationId: z.string().uuid(),
      directoryId: z.string().uuid(),
    })
    .safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid reconciliation payload' }

  const supabase = await createClient()
  try {
    await linkVerificationDirectory(supabase, parsed.data)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Link failed' }
  }

  revalidateVerificationPaths(parsed.data.verificationId)
  return { ok: true }
}

export async function createVerificationDirectory(input: {
  verificationId: string
}): Promise<ReviewVerificationActionResult> {
  const actor = await requireDecisionActor()
  if (!actor.ok) return { ok: false, error: actor.error }

  const parsed = z.object({ verificationId: z.string().uuid() }).safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid reconciliation payload' }

  const supabase = await createClient()
  try {
    await createDirectoryForVerification(supabase, parsed.data.verificationId)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Create failed' }
  }

  revalidateVerificationPaths(parsed.data.verificationId)
  return { ok: true }
}

export async function markNeedsReconciliation(input: {
  verificationId: string
}): Promise<ReviewVerificationActionResult> {
  const actor = await requireDecisionActor()
  if (!actor.ok) return { ok: false, error: actor.error }

  const parsed = z.object({ verificationId: z.string().uuid() }).safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid reconciliation payload' }

  const supabase = await createClient()
  try {
    await markVerificationNeedsReconciliation(supabase, {
      verificationId: parsed.data.verificationId,
    })
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Update failed' }
  }

  revalidateVerificationPaths(parsed.data.verificationId)
  return { ok: true }
}
