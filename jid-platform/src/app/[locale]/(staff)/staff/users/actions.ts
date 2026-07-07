'use server'

import { revalidatePath } from 'next/cache'
import { PRIVILEGED_STAFF_ROLES, type UserRole } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { trackServer } from '@/lib/analytics/server'
import { notifyAccountSuspended } from '@/lib/staff/notify-user-events'
import type { Json } from '@/lib/supabase/types'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import { fetchStaffUserDetail } from '@/lib/staff/users-queries'
import {
  createContentFlagSchema,
  staffSuspendUserSchema,
  type CreateContentFlagInput,
  type StaffSuspendUserInput,
} from '@/lib/validations/staff'
import { isStaffManageableProfileRole } from '@/types/staff-users'

export type StaffUserActionResult = { ok: true } | { ok: false; error: string }

type StaffActor = { ok: true; userId: string } | { ok: false; error: string }

async function requireStaffActor(): Promise<StaffActor> {
  try {
    const profile = await requireStaffShellAccess()
    return { ok: true, userId: profile.id }
  } catch {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Authentication required' }

    const { data: row } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = row?.role as UserRole | undefined
    if (!role || !(PRIVILEGED_STAFF_ROLES as readonly string[]).includes(role)) {
      return { ok: false, error: 'Only staff can manage users' }
    }

    return { ok: true, userId: user.id }
  }
}

async function assertManageableTarget(userId: string): Promise<StaffUserActionResult | null> {
  const user = await fetchStaffUserDetail(userId)
  if (!user) return { ok: false, error: 'User not found or outside staff scope' }
  if (!isStaffManageableProfileRole(user.role)) {
    return { ok: false, error: 'User not found or outside staff scope' }
  }
  return null
}

function revalidateStaffUserPaths(userId: string) {
  revalidatePath('/staff/users')
  revalidatePath('/staff/users/suspended')
  revalidatePath(`/staff/users/${userId}`)
  revalidatePath('/staff')
}

async function writeStaffUserAuditLog(input: {
  actorId: string
  action: string
  userId: string
  reason: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}): Promise<StaffUserActionResult | null> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('audit_logs').insert({
      actor_id: input.actorId,
      action: input.action,
      entity_type: 'profile',
      entity_id: input.userId,
      old_data: input.before as Json,
      new_data: input.after as Json,
      metadata: {
        reason: input.reason.trim(),
        source: 'staff_portal',
        target_resource_id: input.userId,
      } as Json,
    })
    if (error) return { ok: false, error: error.message }
    return null
  } catch {
    return null
  }
}

/** Section 8 — suspend via staff_suspend_user RPC (defense-in-depth). */
export async function suspendUser(input: StaffSuspendUserInput): Promise<StaffUserActionResult> {
  const actor = await requireStaffActor()
  if (!actor.ok) return { ok: false, error: actor.error }

  const parsed = staffSuspendUserSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid suspend payload'
    return { ok: false, error: message }
  }

  const { userId, reason } = parsed.data
  if (userId === actor.userId) {
    return { ok: false, error: 'Cannot suspend your own account' }
  }

  const scopeError = await assertManageableTarget(userId)
  if (scopeError) return scopeError

  const supabase = await createClient()
  const { error } = await supabase.rpc('staff_suspend_user', {
    p_user_id: userId,
    p_reason: reason,
  })

  if (error) return { ok: false, error: error.message }

  await notifyAccountSuspended(supabase, { userId, reason })
  await trackServer('staff.user_suspended', actor.userId, { user_id: userId })

  revalidateStaffUserPaths(userId)
  return { ok: true }
}

export async function reinstateUser(
  userId: string,
  reason: string,
): Promise<StaffUserActionResult> {
  if (!reason.trim()) return { ok: false, error: 'Reason is required' }

  const actor = await requireStaffActor()
  if (!actor.ok) return { ok: false, error: actor.error }

  const scopeError = await assertManageableTarget(userId)
  if (scopeError) return scopeError

  const supabase = await createClient()
  const { data: before } = await supabase
    .from('profiles')
    .select('suspended_at, suspended_reason, locked_until')
    .eq('id', userId)
    .maybeSingle()

  const { error } = await (supabase as unknown as {
    rpc: (
      fn: 'reinstate_profile',
      args: { p_target_user_id: string },
    ) => Promise<{ error: { message: string } | null }>
  }).rpc('reinstate_profile', { p_target_user_id: userId })
  if (error) return { ok: false, error: error.message }

  await writeStaffUserAuditLog({
    actorId: actor.userId,
    action: 'user.reinstated',
    userId,
    reason,
    before: before
      ? {
          suspended_at: before.suspended_at,
          suspended_reason: before.suspended_reason,
          locked_until: before.locked_until,
        }
      : null,
    after: { suspended_at: null, suspended_reason: null, locked_until: null },
  })

  revalidateStaffUserPaths(userId)
  await trackServer('staff.user_reinstated', actor.userId, { user_id: userId })
  return { ok: true }
}

export async function forceLogoutUser(
  userId: string,
  reason: string,
): Promise<StaffUserActionResult> {
  if (!reason.trim()) return { ok: false, error: 'Reason is required' }

  const actor = await requireStaffActor()
  if (!actor.ok) return { ok: false, error: actor.error }

  const scopeError = await assertManageableTarget(userId)
  if (scopeError) return scopeError

  const revokedAt = new Date().toISOString()

  try {
    const admin = createAdminClient()
    await admin
      .from('active_sessions')
      .update({ revoked_at: revokedAt })
      .eq('user_id', userId)
      .is('revoked_at', null)

    const { error: signOutError } = await admin.auth.admin.signOut(userId, 'global')
    if (signOutError) return { ok: false, error: signOutError.message }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to revoke sessions',
    }
  }

  await writeStaffUserAuditLog({
    actorId: actor.userId,
    action: 'user.sessions_revoked',
    userId,
    reason,
    before: null,
    after: { revoked_at: revokedAt, scope: 'all' },
  })

  revalidateStaffUserPaths(userId)
  return { ok: true }
}

/** Section 8.1 — flag user profile content (no role changes). */
export async function flagUserContent(
  input: CreateContentFlagInput,
): Promise<StaffUserActionResult> {
  const actor = await requireStaffActor()
  if (!actor.ok) return { ok: false, error: actor.error }

  const parsed = createContentFlagSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid flag payload'
    return { ok: false, error: message }
  }

  if (parsed.data.targetType !== 'profile') {
    return { ok: false, error: 'Staff user flags must target profiles' }
  }

  const scopeError = await assertManageableTarget(parsed.data.targetId)
  if (scopeError) return scopeError

  const supabase = await createClient()
  const { error } = await supabase.from('content_flags').insert({
    reporter_id: actor.userId,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
    status: 'pending',
  })

  if (error) return { ok: false, error: error.message }

  revalidateStaffUserPaths(parsed.data.targetId)
  return { ok: true }
}
