'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type NotificationActionResult = { ok: true } | { ok: false; error: string }

function revalidateNotificationsPath(path = '/notifications') {
  revalidatePath(path)
}

async function requireNotificationActor() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false as const, error: 'Authentication required' }
  }

  return { ok: true as const, supabase, userId: user.id }
}

/** Mark a single notification as read for the signed-in recipient. */
export async function markAsRead(id: string): Promise<NotificationActionResult> {
  const actor = await requireNotificationActor()
  if (!actor.ok) return actor

  const now = new Date().toISOString()
  const { error } = await actor.supabase
    .from('notifications')
    .update({ read_at: now })
    .eq('id', id)
    .eq('recipient_id', actor.userId)
    .is('read_at', null)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidateNotificationsPath()
  return { ok: true }
}

/** Mark every unread, unarchived notification as read for the signed-in user. */
export async function markAllAsRead(): Promise<NotificationActionResult> {
  const actor = await requireNotificationActor()
  if (!actor.ok) return actor

  const now = new Date().toISOString()
  const { error } = await actor.supabase
    .from('notifications')
    .update({ read_at: now })
    .eq('recipient_id', actor.userId)
    .is('read_at', null)
    .is('archived_at', null)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidateNotificationsPath()
  return { ok: true }
}

/** Archive a notification for the signed-in recipient (also marks read if needed). */
export async function archiveNotification(id: string): Promise<NotificationActionResult> {
  const actor = await requireNotificationActor()
  if (!actor.ok) return actor

  const now = new Date().toISOString()
  const { error } = await actor.supabase
    .from('notifications')
    .update({
      archived_at: now,
      read_at: now,
    })
    .eq('id', id)
    .eq('recipient_id', actor.userId)
    .is('archived_at', null)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidateNotificationsPath()
  return { ok: true }
}
