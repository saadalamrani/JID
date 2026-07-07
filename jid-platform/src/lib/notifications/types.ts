import type { Database } from '@/lib/supabase/types'

export type NotificationCategory = Database['public']['Enums']['notification_category_enum']
export type NotificationPriority = Database['public']['Enums']['notification_priority_enum']

export type NotificationRow = Database['public']['Tables']['notifications']['Row']

export type NotificationListItem = Pick<
  NotificationRow,
  | 'id'
  | 'category'
  | 'priority'
  | 'title_ar'
  | 'title_en'
  | 'body_ar'
  | 'body_en'
  | 'action_url'
  | 'action_label_ar'
  | 'action_label_en'
  | 'created_at'
  | 'read_at'
>

export type NotificationPageItem = NotificationListItem &
  Pick<NotificationRow, 'archived_at'>

export type NotificationRowVariant = 'dropdown' | 'page'

export function isUnreadNotification(row: {
  read_at: string | null
  archived_at?: string | null
}): boolean {
  return row.read_at == null && row.archived_at == null
}
