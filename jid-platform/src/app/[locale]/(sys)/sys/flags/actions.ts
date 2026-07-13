'use server'

import { revalidatePath } from 'next/cache'
import { trackServer } from '@/lib/analytics/server'
import type { UserRole } from '@/lib/auth/rbac'
import { broadcastFeatureFlagToggle } from '@/lib/feature-flags/broadcast-server'
import { invalidateFlagCache } from '@/lib/feature-flags/invalidate'
import { userRoleSchema } from '@/lib/governance/schemas'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getDevTestSuperAdminProfile } from '@/lib/sys/dev-test-access'
import { resolveUserIdByEmail } from '@/lib/sys/feature-flags'

export type FlagActionResult = { ok: true } | { ok: false; error: string }

type FeatureFlagSnapshot = {
  key: string
  is_enabled: boolean
  enabled_for_roles: UserRole[]
  user_overrides: Record<string, boolean>
}

async function requireSuperAdminActor(): Promise<{ userId: string } | FlagActionResult> {
  const devProfile = getDevTestSuperAdminProfile()
  if (devProfile) return { userId: devProfile.id }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Authentication required' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'super_admin') {
    return { ok: false, error: 'Only super administrators can manage feature flags' }
  }

  return { userId: user.id }
}

function validateReason(reason: string): FlagActionResult | null {
  if (!reason.trim()) {
    return { ok: false, error: 'Reason is required' }
  }
  return null
}

function snapshotFromRow(row: {
  key: string
  is_enabled: boolean
  enabled_for_roles: string[] | null
  user_overrides: unknown
}): FeatureFlagSnapshot {
  const roles = (row.enabled_for_roles ?? []).filter((role): role is UserRole =>
    userRoleSchema.safeParse(role).success,
  )
  const overrides =
    row.user_overrides && typeof row.user_overrides === 'object' && !Array.isArray(row.user_overrides)
      ? (row.user_overrides as Record<string, boolean>)
      : {}

  return {
    key: row.key,
    is_enabled: row.is_enabled,
    enabled_for_roles: roles,
    user_overrides: overrides,
  }
}

async function fetchFlagSnapshot(key: string): Promise<FeatureFlagSnapshot | FlagActionResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('feature_flags').select('*').eq('key', key).maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Feature flag not found' }
  return snapshotFromRow(data)
}

async function writeFlagAuditLog(input: {
  actorId: string
  action: string
  key: string
  reason: string
  before: FeatureFlagSnapshot
  after: FeatureFlagSnapshot
}): Promise<FlagActionResult | null> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('audit_logs').insert({
      actor_id: input.actorId,
      action: input.action,
      entity_type: 'feature_flag',
      entity_id: null,
      old_data: input.before,
      new_data: input.after,
      metadata: {
        reason: input.reason.trim(),
        flag_key: input.key,
        source: 'sys_portal',
      },
    })

    if (error) return { ok: false, error: error.message }
    return null
  } catch {
    return { ok: false, error: 'Audit log failed — change was not saved' }
  }
}

function revalidateFlagPaths(key: string) {
  revalidatePath('/sys/flags')
  revalidatePath(`/sys/flags/${key}`)
}

async function publishFeatureFlagChange(key: string, isEnabled: boolean) {
  invalidateFlagCache(key)

  try {
    await broadcastFeatureFlagToggle({ key, isEnabled })
  } catch (error) {
    console.warn('feature flag realtime broadcast failed:', error)
  }
}

/** Section 7.3 — global on/off with mandatory reason + audit diff. */
export async function toggleFlagGlobally(
  key: string,
  isEnabled: boolean,
  reason: string,
): Promise<FlagActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const before = await fetchFlagSnapshot(key)
  if ('ok' in before) return before

  const supabase = await createClient()
  const { error } = await supabase
    .from('feature_flags')
    .update({
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
      updated_by: actor.userId,
    })
    .eq('key', key)

  if (error) return { ok: false, error: error.message }

  const after: FeatureFlagSnapshot = { ...before, is_enabled: isEnabled }
  const auditError = await writeFlagAuditLog({
    actorId: actor.userId,
    action: 'feature_flag.toggle_global',
    key,
    reason,
    before,
    after,
  })
  if (auditError) return auditError

  await trackServer('sys.flag_toggled', actor.userId, { flag_key: key, is_enabled: isEnabled })
  revalidateFlagPaths(key)
  await publishFeatureFlagChange(key, isEnabled)
  return { ok: true }
}

export async function setRoleOverride(
  key: string,
  enabledForRoles: UserRole[],
  reason: string,
): Promise<FlagActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const before = await fetchFlagSnapshot(key)
  if ('ok' in before) return before

  const supabase = await createClient()
  const { error } = await supabase
    .from('feature_flags')
    .update({
      enabled_for_roles: enabledForRoles,
      updated_at: new Date().toISOString(),
      updated_by: actor.userId,
    })
    .eq('key', key)

  if (error) return { ok: false, error: error.message }

  const after: FeatureFlagSnapshot = { ...before, enabled_for_roles: enabledForRoles }
  const auditError = await writeFlagAuditLog({
    actorId: actor.userId,
    action: 'feature_flag.set_role_override',
    key,
    reason,
    before,
    after,
  })
  if (auditError) return auditError

  revalidateFlagPaths(key)
  await publishFeatureFlagChange(key, before.is_enabled)
  return { ok: true }
}

export async function setUserOverride(
  key: string,
  userIdOrEmail: string,
  enabled: boolean,
  reason: string,
): Promise<FlagActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const before = await fetchFlagSnapshot(key)
  if ('ok' in before) return before

  let userId = userIdOrEmail.trim()
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    const resolved = await resolveUserIdByEmail(userId)
    if (!resolved) return { ok: false, error: 'User not found for that email or search term' }
    userId = resolved
  }

  const nextOverrides = { ...before.user_overrides, [userId]: enabled }

  const supabase = await createClient()
  const { error } = await supabase
    .from('feature_flags')
    .update({
      user_overrides: nextOverrides,
      updated_at: new Date().toISOString(),
      updated_by: actor.userId,
    })
    .eq('key', key)

  if (error) return { ok: false, error: error.message }

  const after: FeatureFlagSnapshot = { ...before, user_overrides: nextOverrides }
  const auditError = await writeFlagAuditLog({
    actorId: actor.userId,
    action: 'feature_flag.set_user_override',
    key,
    reason,
    before,
    after,
  })
  if (auditError) return auditError

  revalidateFlagPaths(key)
  await publishFeatureFlagChange(key, before.is_enabled)
  return { ok: true }
}

export async function removeUserOverride(
  key: string,
  userId: string,
  reason: string,
): Promise<FlagActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const before = await fetchFlagSnapshot(key)
  if ('ok' in before) return before

  const nextOverrides = { ...before.user_overrides }
  delete nextOverrides[userId]

  const supabase = await createClient()
  const { error } = await supabase
    .from('feature_flags')
    .update({
      user_overrides: nextOverrides,
      updated_at: new Date().toISOString(),
      updated_by: actor.userId,
    })
    .eq('key', key)

  if (error) return { ok: false, error: error.message }

  const after: FeatureFlagSnapshot = { ...before, user_overrides: nextOverrides }
  const auditError = await writeFlagAuditLog({
    actorId: actor.userId,
    action: 'feature_flag.remove_user_override',
    key,
    reason,
    before,
    after,
  })
  if (auditError) return auditError

  revalidateFlagPaths(key)
  await publishFeatureFlagChange(key, before.is_enabled)
  return { ok: true }
}
