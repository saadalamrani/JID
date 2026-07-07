'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { notifyMentorApplicationApproved } from '@/lib/mentor-application/notify-application-approved'
import {
  requireSuperAdminActor,
  validateReason,
  writeSysAuditLog,
  type SysActionResult,
} from '@/lib/sys/sys-actions-shared'

export type MentorApplicationActionResult = SysActionResult

function revalidateMentorPaths() {
  revalidatePath('/sys/mentor-applications')
}

async function fetchMentorSnapshot(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mentor_profiles')
    .select('user_id, status, slug, rejection_reason')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function approveMentorApplication(
  userId: string,
  reason: string,
): Promise<MentorApplicationActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const before = await fetchMentorSnapshot(userId)
  if (!before) return { ok: false, error: 'Mentor application not found' }
  if (!['pending_review', 'under_review', 'pending'].includes(before.status)) {
    return { ok: false, error: 'Application is not pending review' }
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('mentor_profiles')
    .update({
      status: 'approved',
      reviewed_by: actor.userId,
      reviewed_at: now,
      rejection_reason: null,
      is_accepting_requests: true,
    })
    .eq('user_id', userId)
    .select('user_id, slug, status')
    .maybeSingle()

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to approve' }

  await notifyMentorApplicationApproved(supabase, {
    userId,
    slug: data.slug,
    reviewNotes: reason.trim(),
  })

  const auditError = await writeSysAuditLog({
    actorId: actor.userId,
    action: 'mentor.approved',
    entityType: 'mentor_profile',
    entityId: userId,
    reason,
    before: { status: before.status },
    after: { status: 'approved' },
    extraMetadata: { super_admin_action: true, target_resource_id: userId },
  })
  if (auditError) return auditError

  revalidateMentorPaths()
  return { ok: true }
}

/** Re-approve a Staff-rejected mentor application. */
export async function overrideMentorRejection(
  userId: string,
  reason: string,
): Promise<MentorApplicationActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const before = await fetchMentorSnapshot(userId)
  if (!before) return { ok: false, error: 'Mentor application not found' }
  if (before.status !== 'rejected') {
    return { ok: false, error: 'Only rejected applications can be overridden' }
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('mentor_profiles')
    .update({
      status: 'approved',
      reviewed_by: actor.userId,
      reviewed_at: now,
      rejection_reason: null,
      is_accepting_requests: true,
    })
    .eq('user_id', userId)
    .eq('status', 'rejected')
    .select('user_id, slug, status')
    .maybeSingle()

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to override rejection' }

  await notifyMentorApplicationApproved(supabase, {
    userId,
    slug: data.slug,
    reviewNotes: `[Super Admin override] ${reason.trim()}`,
  })

  const auditError = await writeSysAuditLog({
    actorId: actor.userId,
    action: 'mentor.rejection_overridden',
    entityType: 'mentor_profile',
    entityId: userId,
    reason,
    before: { status: 'rejected', rejection_reason: before.rejection_reason },
    after: { status: 'approved' },
    extraMetadata: {
      super_admin_override: true,
      staff_rejection_overridden: true,
      target_resource_id: userId,
    },
  })
  if (auditError) return auditError

  revalidateMentorPaths()
  return { ok: true }
}

export async function suspendApprovedMentor(
  userId: string,
  reason: string,
): Promise<MentorApplicationActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const before = await fetchMentorSnapshot(userId)
  if (!before) return { ok: false, error: 'Mentor profile not found' }
  if (before.status !== 'approved') {
    return { ok: false, error: 'Only approved mentors can be suspended' }
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('mentor_profiles')
    .update({
      status: 'suspended',
      reviewed_by: actor.userId,
      reviewed_at: now,
      is_accepting_requests: false,
    })
    .eq('user_id', userId)
    .eq('status', 'approved')

  if (error) return { ok: false, error: error.message }

  const auditError = await writeSysAuditLog({
    actorId: actor.userId,
    action: 'mentor.suspended',
    entityType: 'mentor_profile',
    entityId: userId,
    reason,
    before: { status: 'approved' },
    after: { status: 'suspended' },
    extraMetadata: { super_admin_action: true, target_resource_id: userId },
  })
  if (auditError) return auditError

  revalidateMentorPaths()
  return { ok: true }
}

export async function rejectMentorApplication(
  userId: string,
  reason: string,
  rejectionReason: string,
): Promise<MentorApplicationActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError
  if (!rejectionReason.trim()) {
    return { ok: false, error: 'Rejection reason is required' }
  }

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const before = await fetchMentorSnapshot(userId)
  if (!before) return { ok: false, error: 'Mentor application not found' }
  if (!['pending_review', 'under_review', 'pending'].includes(before.status)) {
    return { ok: false, error: 'Application is not pending review' }
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('mentor_profiles')
    .update({
      status: 'rejected',
      reviewed_by: actor.userId,
      reviewed_at: now,
      rejection_reason: rejectionReason.trim(),
      is_accepting_requests: false,
    })
    .eq('user_id', userId)

  if (error) return { ok: false, error: error.message }

  const auditError = await writeSysAuditLog({
    actorId: actor.userId,
    action: 'mentor.rejected',
    entityType: 'mentor_profile',
    entityId: userId,
    reason,
    before: { status: before.status },
    after: { status: 'rejected', rejection_reason: rejectionReason.trim() },
    extraMetadata: { super_admin_action: true, target_resource_id: userId },
  })
  if (auditError) return auditError

  revalidateMentorPaths()
  return { ok: true }
}
