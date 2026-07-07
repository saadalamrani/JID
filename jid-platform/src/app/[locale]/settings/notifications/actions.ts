'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isMandatoryNotificationCategory, channelColumn } from '@/lib/notifications/preference-defaults'
import { resolveNotificationPreference } from '@/lib/notifications/preference-defaults'
import type { NotificationPreferenceChannel } from '@/lib/notifications/preference-defaults'
import type { NotificationCategory } from '@/lib/notifications/types'

export type UpdatePreferenceInput = {
  category: NotificationCategory
  channel: NotificationPreferenceChannel
  value: boolean
}

export type UpdatePreferenceResult = { ok: true } | { ok: false; error: string }

function revalidateNotificationSettingsPath(path = '/settings/notifications') {
  revalidatePath(path)
}

export async function updatePreference(
  input: UpdatePreferenceInput,
): Promise<UpdatePreferenceResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, error: 'Authentication required' }
  }

  if (isMandatoryNotificationCategory(input.category)) {
    return { ok: false, error: 'Mandatory security notifications cannot be modified' }
  }

  const { data: existingRow, error: fetchError } = await supabase
    .from('notification_preferences')
    .select('category, in_app_enabled, email_enabled, include_in_digest')
    .eq('user_id', user.id)
    .eq('category', input.category)
    .maybeSingle()

  if (fetchError) {
    return { ok: false, error: fetchError.message }
  }

  const resolved = resolveNotificationPreference(
    input.category,
    existingRow
      ? {
          category: input.category,
          in_app_enabled: existingRow.in_app_enabled,
          email_enabled: existingRow.email_enabled,
          include_in_digest: existingRow.include_in_digest,
        }
      : undefined,
  )

  const column = channelColumn(input.channel)
  const payload = {
    user_id: user.id,
    category: input.category,
    in_app_enabled: column === 'in_app_enabled' ? input.value : resolved.in_app_enabled,
    email_enabled: column === 'email_enabled' ? input.value : resolved.email_enabled,
    include_in_digest: column === 'include_in_digest' ? input.value : resolved.include_in_digest,
    updated_at: new Date().toISOString(),
  }

  const { error: upsertError } = await supabase
    .from('notification_preferences')
    .upsert(payload, { onConflict: 'user_id,category' })

  if (upsertError) {
    return { ok: false, error: upsertError.message }
  }

  revalidateNotificationSettingsPath()
  return { ok: true }
}
