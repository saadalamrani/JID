'use server'

import { revalidatePath } from 'next/cache'
import { trackServer } from '@/lib/analytics/server'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import {
  parsePlatformConfigInput,
  platformConfigValueTypeSchema,
} from '@/lib/sys/platform-config'
import { fetchPlatformConfigByKey } from '@/lib/sys/platform-config-queries'
import {
  requireSuperAdminActor,
  validateReason,
  writeSysAuditLog,
  type SysActionResult,
} from '@/lib/sys/sys-actions-shared'

export type ConfigActionResult = SysActionResult

function revalidateConfigPaths(key: string) {
  revalidatePath('/sys/config')
  revalidatePath(`/sys/config/${encodeURIComponent(key)}`)
}

/** Section 10 — update platform_config with reason + typed validation. */
export async function updateConfig(
  key: string,
  rawValue: string,
  reason: string,
): Promise<ConfigActionResult> {
  const reasonError = validateReason(reason)
  if (reasonError) return reasonError

  const actor = await requireSuperAdminActor()
  if ('ok' in actor) return actor

  const before = await fetchPlatformConfigByKey(key)
  if (!before) return { ok: false, error: 'Config key not found' }

  const valueType = platformConfigValueTypeSchema.parse(before.value_type)

  let parsed: unknown
  try {
    parsed = parsePlatformConfigInput(valueType, rawValue)
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid value for declared type',
    }
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('platform_config')
    .update({
      value: parsed as Json,
      updated_at: now,
      updated_by: actor.userId,
    })
    .eq('key', key)

  if (error) return { ok: false, error: error.message }

  const auditError = await writeSysAuditLog({
    actorId: actor.userId,
    action: 'platform_config.updated',
    entityType: 'platform_config',
    entityId: null,
    reason,
    before: {
      key,
      value: before.is_secret ? '[secret]' : before.value,
      value_type: before.value_type,
    },
    after: {
      key,
      value: before.is_secret ? '[secret]' : parsed,
      value_type: before.value_type,
    },
    extraMetadata: {
      config_key: key,
      target_resource_id: key,
    },
  })
  if (auditError) return auditError

  await trackServer('sys.config_updated', actor.userId, { config_key: key })
  revalidateConfigPaths(key)
  return { ok: true }
}
