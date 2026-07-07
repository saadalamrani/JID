'use server'

import { revalidatePath } from 'next/cache'
import { isUserRole } from '@/lib/auth/rbac'
import { createClient } from '@/lib/supabase/server'
import {
  requireSuperAdminActor,
  validateReason,
  writeSysAuditLog,
  type SysActionResult,
} from '@/lib/sys/sys-actions-shared'

export type StaffActionResult = SysActionResult

function revalidateStaffPaths(staffId: string) {
  revalidatePath('/sys/staff')
  revalidatePath(`/sys/staff/${staffId}`)
}

/** Revoke staff portal access by demoting to individual. */
export async function revokeStaffAccess(
  staffId: string,
  reason: string,
  confirmSuperAdminTarget = false,
): Promise<StaffActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  if (staffId === actor.userId) {
    return { ok: false, error: 'You cannot revoke your own staff access' }
  }

  const supabase = await createClient()
  const { data: target, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', staffId)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!target || !isUserRole(target.role)) return { ok: false, error: 'Staff member not found' }
  if (!['staff', 'admin', 'super_admin'].includes(target.role)) {
    return { ok: false, error: 'User is not a staff member' }
  }

  if (target.role === 'super_admin' && !confirmSuperAdminTarget) {
    return {
      ok: false,
      error: 'Explicit confirmation required to revoke another super administrator',
    }
  }

  const { error: rpcError } = await supabase.rpc('set_user_role', {
    p_target_user_id: staffId,
    p_new_role: 'individual',
  })

  if (rpcError) return { ok: false, error: rpcError.message }

  const auditError = await writeSysAuditLog({
    actorId: actor.userId,
    action: 'staff.access_revoked',
    entityType: 'profile',
    entityId: staffId,
    reason,
    before: { role: target.role },
    after: { role: 'individual' },
    extraMetadata: { target_resource_id: staffId },
  })
  if (auditError) return auditError

  revalidateStaffPaths(staffId)
  return { ok: true }
}
