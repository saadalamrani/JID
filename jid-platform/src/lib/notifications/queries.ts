import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { parseNotificationCategory } from '@/lib/notifications/categories'
import type { NotificationPageItem } from '@/lib/notifications/types'

export type NotificationStatusFilter = 'all' | 'unread' | 'archived'

export type NotificationListFilters = {
  status?: string | null
  category?: string | null
}

const PAGE_SELECT =
  'id, category, priority, title_ar, title_en, body_ar, body_en, action_url, action_label_ar, action_label_en, created_at, read_at, archived_at' as const

const LIST_LIMIT = 50

export function parseNotificationStatusFilter(
  value: string | null | undefined,
): NotificationStatusFilter {
  if (value === 'unread' || value === 'archived') return value
  return 'all'
}

export async function fetchUserNotifications(
  userId: string,
  filters: NotificationListFilters,
): Promise<NotificationPageItem[]> {
  const supabase = await createClient()
  const status = parseNotificationStatusFilter(filters.status)
  const category = parseNotificationCategory(filters.category)

  let query = supabase
    .from('notifications')
    .select(PAGE_SELECT)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT)

  if (status === 'unread') {
    query = query.is('read_at', null).is('archived_at', null)
  } else if (status === 'archived') {
    query = query.not('archived_at', 'is', null)
  } else {
    query = query.is('archived_at', null)
  }

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as NotificationPageItem[]
}
