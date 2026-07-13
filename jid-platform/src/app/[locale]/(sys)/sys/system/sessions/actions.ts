'use server'

import { revalidatePath } from 'next/cache'
import { trackServer } from '@/lib/analytics/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  requireSuperAdminActor,
  validateReason,
  writeSysAuditLog,
  type SysActionResult,
} from '@/lib/sys/sys-actions-shared'

export type SessionActionResult = SysActionResult

function revalidateSessionPaths() {
  revalidatePath('/sys/system/sessions')
}

export async function revokePlatformSession(
  sessionId: string,
  userId: string,
  reason: string,
): Promise<SessionActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const revokedAt = new Date().toISOString()

  try {
    const admin = createAdminClient()
    await admin
      .from('active_sessions')
      .update({ revoked_at: revokedAt })
      .eq('id', sessionId)

    const { error } = await admin.auth.admin.signOut(userId, 'global')
    if (error) return { ok: false, error: error.message }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Revoke failed' }
  }

  const auditError = await writeSysAuditLog({
    actorId: actor.userId,
    action: 'session.revoked',
    entityType: 'active_session',
    entityId: sessionId,
    reason,
    before: null,
    after: { revoked_at: revokedAt, user_id: userId },
    extraMetadata: { target_resource_id: userId },
  })
  if (auditError) return auditError

  await trackServer('sys.session_revoked', actor.userId, { session_id: sessionId, user_id: userId })
  revalidateSessionPaths()
  return { ok: true }
}

export async function revokeAllPlatformSessions(reason: string): Promise<SessionActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const revokedAt = new Date().toISOString()

  try {
    const admin = createAdminClient()
    const { data: sessions } = await admin
      .from('active_sessions')
      .select('id, user_id')
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())

    await admin
      .from('active_sessions')
      .update({ revoked_at: revokedAt })
      .is('revoked_at', null)

    const userIds = Array.from(new Set((sessions ?? []).map((s) => s.user_id)))
    for (const userId of userIds) {
      await admin.auth.admin.signOut(userId, 'global')
    }

    const auditError = await writeSysAuditLog({
      actorId: actor.userId,
      action: 'session.bulk_revoked',
      entityType: 'active_session',
      entityId: null,
      reason,
      before: null,
      after: { revoked_at: revokedAt, session_count: sessions?.length ?? 0, user_count: userIds.length },
      extraMetadata: { bulk: true },
    })
    if (auditError) return auditError

    await trackServer('sys.sessions_bulk_revoked', actor.userId, {
      session_count: sessions?.length ?? 0,
    })
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Bulk revoke failed' }
  }

  revalidateSessionPaths()
  return { ok: true }
}
