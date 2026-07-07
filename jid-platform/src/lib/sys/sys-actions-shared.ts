import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import { getDevTestSuperAdminProfile } from '@/lib/sys/dev-test-access'

export type SysActionResult = { ok: true } | { ok: false; error: string }

export async function requireSuperAdminActor(): Promise<{ userId: string } | SysActionResult> {
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
    return { ok: false, error: 'Only super administrators can perform this action' }
  }

  return { userId: user.id }
}

export function validateReason(reason: string): SysActionResult | null {
  if (!reason.trim()) return { ok: false, error: 'Reason is required' }
  return null
}

export async function writeSysAuditLog(input: {
  actorId: string
  action: string
  entityType: string
  entityId: string | null
  reason: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  extraMetadata?: Record<string, unknown>
}): Promise<SysActionResult | null> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('audit_logs').insert({
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      old_data: input.before as Json,
      new_data: input.after as Json,
      metadata: {
        reason: input.reason.trim(),
        source: 'sys_portal',
        ...(input.extraMetadata ?? {}),
      } as Json,
    })
    if (error) return { ok: false, error: error.message }
    return null
  } catch {
    return { ok: false, error: 'Audit log failed — change was not saved' }
  }
}
