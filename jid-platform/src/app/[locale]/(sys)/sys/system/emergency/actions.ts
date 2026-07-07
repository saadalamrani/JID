'use server'

import { revalidatePath } from 'next/cache'
import { trackServer } from '@/lib/analytics/server'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import { invalidateMiddlewarePlatformGatesCache } from '@/lib/sys/platform-gates'
import {
  requireSuperAdminActor,
  validateReason,
  writeSysAuditLog,
  type SysActionResult,
} from '@/lib/sys/sys-actions-shared'

export type EmergencyActionResult = SysActionResult

const EMERGENCY_ACTION_MAINTENANCE = 'maintenance_mode'
const EMERGENCY_ACTION_REGISTRATIONS = 'registrations_open'

function revalidateEmergencyPaths() {
  revalidatePath('/sys/system/emergency')
  invalidateMiddlewarePlatformGatesCache()
}

async function insertEmergencyAction(input: {
  actorId: string
  actionType: string
  reason: string
  payload?: Record<string, unknown>
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('emergency_actions')
    .insert({
      action_type: input.actionType,
      reason: input.reason.trim(),
      activated_by: input.actorId,
      payload: (input.payload ?? {}) as Json,
      is_active: true,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to record emergency action')
  return data.id as string
}

async function revertEmergencyActionRecord(actionId: string, actorId: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('emergency_actions')
    .update({
      is_active: false,
      deactivated_at: now,
      deactivated_by: actorId,
      reverted_at: now,
      reverted_by: actorId,
    })
    .eq('id', actionId)

  if (error) throw new Error(error.message)
}

export async function triggerMaintenanceMode(reason: string): Promise<EmergencyActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const supabase = await createClient()
  const payload = { enabled: true, message: reason.trim() }

  const { error } = await supabase
    .from('platform_config')
    .update({ value: payload as Json, updated_at: new Date().toISOString(), updated_by: actor.userId })
    .eq('key', 'maintenance_mode')

  if (error) return { ok: false, error: error.message }

  const emergencyId = await insertEmergencyAction({
    actorId: actor.userId,
    actionType: EMERGENCY_ACTION_MAINTENANCE,
    reason,
    payload,
  })

  const auditError = await writeSysAuditLog({
    actorId: actor.userId,
    action: 'emergency.maintenance_enabled',
    entityType: 'emergency_action',
    entityId: emergencyId,
    reason,
    before: { enabled: false },
    after: payload,
    extraMetadata: { emergency_action_id: emergencyId },
  })
  if (auditError) return auditError

  await trackServer('sys.emergency_maintenance_enabled', actor.userId, { emergency_id: emergencyId })
  revalidateEmergencyPaths()
  return { ok: true }
}

export async function revertMaintenanceMode(
  emergencyActionId: string,
  reason: string,
): Promise<EmergencyActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const supabase = await createClient()
  const payload = { enabled: false, message: '' }

  const { error } = await supabase
    .from('platform_config')
    .update({ value: payload as Json, updated_at: new Date().toISOString(), updated_by: actor.userId })
    .eq('key', 'maintenance_mode')

  if (error) return { ok: false, error: error.message }

  await revertEmergencyActionRecord(emergencyActionId, actor.userId)

  const auditError = await writeSysAuditLog({
    actorId: actor.userId,
    action: 'emergency.maintenance_disabled',
    entityType: 'emergency_action',
    entityId: emergencyActionId,
    reason,
    before: { enabled: true },
    after: payload,
    extraMetadata: { reverted_at: new Date().toISOString() },
  })
  if (auditError) return auditError

  await trackServer('sys.emergency_maintenance_disabled', actor.userId, { emergency_id: emergencyActionId })
  revalidateEmergencyPaths()
  return { ok: true }
}

export async function triggerRegistrationsClosed(reason: string): Promise<EmergencyActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const supabase = await createClient()

  const { error } = await supabase
    .from('platform_config')
    .update({
      value: false as unknown as Json,
      updated_at: new Date().toISOString(),
      updated_by: actor.userId,
    })
    .eq('key', 'registrations_open')

  if (error) return { ok: false, error: error.message }

  const emergencyId = await insertEmergencyAction({
    actorId: actor.userId,
    actionType: EMERGENCY_ACTION_REGISTRATIONS,
    reason,
    payload: { registrations_open: false },
  })

  const auditError = await writeSysAuditLog({
    actorId: actor.userId,
    action: 'emergency.registrations_closed',
    entityType: 'emergency_action',
    entityId: emergencyId,
    reason,
    before: { registrations_open: true },
    after: { registrations_open: false },
    extraMetadata: { emergency_action_id: emergencyId },
  })
  if (auditError) return auditError

  await trackServer('sys.emergency_registrations_closed', actor.userId, { emergency_id: emergencyId })
  revalidateEmergencyPaths()
  return { ok: true }
}

export async function revertRegistrationsOpen(
  emergencyActionId: string,
  reason: string,
): Promise<EmergencyActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const supabase = await createClient()

  const { error } = await supabase
    .from('platform_config')
    .update({
      value: true as unknown as Json,
      updated_at: new Date().toISOString(),
      updated_by: actor.userId,
    })
    .eq('key', 'registrations_open')

  if (error) return { ok: false, error: error.message }

  await revertEmergencyActionRecord(emergencyActionId, actor.userId)

  const auditError = await writeSysAuditLog({
    actorId: actor.userId,
    action: 'emergency.registrations_opened',
    entityType: 'emergency_action',
    entityId: emergencyActionId,
    reason,
    before: { registrations_open: false },
    after: { registrations_open: true },
    extraMetadata: { reverted_at: new Date().toISOString() },
  })
  if (auditError) return auditError

  await trackServer('sys.emergency_registrations_opened', actor.userId, { emergency_id: emergencyActionId })
  revalidateEmergencyPaths()
  return { ok: true }
}
