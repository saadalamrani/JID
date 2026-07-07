import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { MATRIX_CATEGORIES } from '@/lib/notifications/category-groups'
import {
  resolveNotificationPreference,
  type ResolvedNotificationPreference,
  type StoredNotificationPreference,
} from '@/lib/notifications/preference-defaults'
import type { NotificationCategory } from '@/lib/notifications/types'

export async function fetchUserNotificationPreferences(
  userId: string,
): Promise<ResolvedNotificationPreference[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('category, in_app_enabled, email_enabled, include_in_digest')
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }

  const storedByCategory = new Map<NotificationCategory, StoredNotificationPreference>()
  for (const row of data ?? []) {
    storedByCategory.set(row.category as NotificationCategory, {
      category: row.category as NotificationCategory,
      in_app_enabled: row.in_app_enabled,
      email_enabled: row.email_enabled,
      include_in_digest: row.include_in_digest,
    })
  }

  return MATRIX_CATEGORIES.map((category) =>
    resolveNotificationPreference(category, storedByCategory.get(category)),
  )
}
