'use server'

import { revalidatePath } from 'next/cache'
import { trackServer } from '@/lib/analytics/server'
import type { UserRole } from '@/lib/auth/rbac'
import { isUserRole } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import { getDevTestSuperAdminProfile } from '@/lib/sys/dev-test-access'
import { MENTOR_ROLE_BLOCKED_ERROR } from '@/types/sys-users'

export type UserActionResult = { ok: true } | { ok: false; error: string }

type ProfileSnapshot = {
  id: string
  role: UserRole
  suspended_at: string | null
  suspended_reason: string | null
  locked_until: string | null
}

async function requireSuperAdminActor(): Promise<{ userId: string } | UserActionResult> {
  const devProfile = getDevTestSuperAdminProfile()
  if (devProfile) return { userId: devProfile.id }

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

  if (profile?.role !== 'super_admin') {
    return { ok: false, error: 'Only super administrators can manage users' }
  }

  return { userId: user.id }
}

function validateReason(reason: string): UserActionResult | null {
  if (!reason.trim()) return { ok: false, error: 'Reason is required' }
  return null
}

async function fetchProfileSnapshot(userId: string): Promise<ProfileSnapshot | UserActionResult> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, suspended_at, suspended_reason, locked_until')
    .eq('id', userId)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data || !isUserRole(data.role)) return { ok: false, error: 'User not found' }

  return {
    id: data.id,
    role: data.role,
    suspended_at: data.suspended_at,
    suspended_reason: data.suspended_reason,
    locked_until: data.locked_until,
  }
}

async function writeUserAuditLog(input: {
  actorId: string
  action: string
  userId: string
  reason: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}): Promise<UserActionResult | null> {
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
        source: 'sys_portal',
        target_resource_id: input.userId,
      } as Json,
    })
    if (error) return { ok: false, error: error.message }
    return null
  } catch {
    return { ok: false, error: 'Audit log failed — change was not saved' }
  }
}

function revalidateUserPaths(userId: string) {
  revalidatePath('/sys/users')
  revalidatePath(`/sys/users/${userId}`)
}

/** Section 8.3 — suspend with self-block and super_admin confirmation. */
export async function suspendUser(
  userId: string,
  reason: string,
  confirmSuperAdminTarget = false,
): Promise<UserActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  if (userId === actor.userId) {
    return { ok: false, error: 'You cannot suspend your own account' }
  }

  const before = await fetchProfileSnapshot(userId)
  if ('ok' in before) return before

  if (before.role === 'super_admin' && !confirmSuperAdminTarget) {
    return {
      ok: false,
      error: 'Explicit confirmation required to suspend another super administrator',
    }
  }

  const supabase = await createClient()
  const suspendedAt = new Date().toISOString()
  const { error } = await supabase
    .from('profiles')
    .update({
      suspended_at: suspendedAt,
      suspended_reason: reason.trim(),
      updated_at: suspendedAt,
    })
    .eq('id', userId)

  if (error) return { ok: false, error: error.message }

  const auditError = await writeUserAuditLog({
    actorId: actor.userId,
    action: 'user.suspended',
    userId,
    reason,
    before: {
      suspended_at: before.suspended_at,
      suspended_reason: before.suspended_reason,
    },
    after: {
      suspended_at: suspendedAt,
      suspended_reason: reason.trim(),
    },
  })
  if (auditError) return auditError

  await trackServer('sys.user_suspended', actor.userId, { user_id: userId })
  revalidateUserPaths(userId)
  return { ok: true }
}

export async function reinstateUser(userId: string, reason: string): Promise<UserActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const before = await fetchProfileSnapshot(userId)
  if ('ok' in before) return before

  const supabase = await createClient()
  const { error } = await (supabase as unknown as {
    rpc: (
      fn: 'reinstate_profile',
      args: { p_target_user_id: string },
    ) => Promise<{ error: { message: string } | null }>
  }).rpc('reinstate_profile', { p_target_user_id: userId })
  if (error) return { ok: false, error: error.message }

  const auditError = await writeUserAuditLog({
    actorId: actor.userId,
    action: 'user.reinstated',
    userId,
    reason,
    before: {
      suspended_at: before.suspended_at,
      suspended_reason: before.suspended_reason,
      locked_until: before.locked_until,
    },
    after: {
      suspended_at: null,
      suspended_reason: null,
      locked_until: null,
    },
  })
  if (auditError) return auditError

  revalidateUserPaths(userId)
  return { ok: true }
}

export async function forceLogoutUser(userId: string, reason: string): Promise<UserActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const before = await fetchProfileSnapshot(userId)
  if ('ok' in before) return before

  const revokedAt = new Date().toISOString()

  try {
    const admin = createAdminClient()
    await admin
      .from('active_sessions')
      .update({ revoked_at: revokedAt })
      .eq('user_id', userId)
      .is('revoked_at', null)

    const { error: signOutError } = await admin.auth.admin.signOut(userId, 'global')
    if (signOutError) {
      return { ok: false, error: signOutError.message }
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to revoke sessions',
    }
  }

  const auditError = await writeUserAuditLog({
    actorId: actor.userId,
    action: 'user.sessions_revoked',
    userId,
    reason,
    before: null,
    after: { revoked_at: revokedAt, scope: 'all' },
  })
  if (auditError) return auditError

  revalidateUserPaths(userId)
  return { ok: true }
}

export async function changeUserRole(
  userId: string,
  newRole: string,
  reason: string,
): Promise<UserActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  if (newRole === 'mentor') {
    return { ok: false, error: MENTOR_ROLE_BLOCKED_ERROR }
  }

  if (!isUserRole(newRole)) {
    return { ok: false, error: 'Invalid role' }
  }

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  if (userId === actor.userId) {
    return { ok: false, error: 'You cannot change your own role' }
  }

  const before = await fetchProfileSnapshot(userId)
  if ('ok' in before) return before

  const supabase = await createClient()
  const { error } = await supabase.rpc('set_user_role', {
    p_target_user_id: userId,
    p_new_role: newRole,
  })

  if (error) {
    if (error.message.toLowerCase().includes('mentor')) {
      return { ok: false, error: MENTOR_ROLE_BLOCKED_ERROR }
    }
    return { ok: false, error: error.message }
  }

  const auditError = await writeUserAuditLog({
    actorId: actor.userId,
    action: 'user.role_changed',
    userId,
    reason,
    before: { role: before.role },
    after: { role: newRole },
  })
  if (auditError) return auditError

  await trackServer('sys.user_role_changed', actor.userId, { user_id: userId, new_role: newRole })
  revalidateUserPaths(userId)
  return { ok: true }
}