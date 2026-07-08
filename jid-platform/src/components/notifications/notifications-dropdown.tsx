'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { BellOff, Loader2 } from 'lucide-react'
import { markAllAsRead } from '@/components/notifications/actions'
import { NotificationRow } from '@/components/notifications/notification-row'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { NotificationListItem } from '@/lib/notifications/types'
import { isUnreadNotification } from '@/lib/notifications/types'

const LIST_LIMIT = 15

const NOTIFICATION_SELECT =
  'id, category, priority, title_ar, title_en, body_ar, body_en, action_url, action_label_ar, action_label_en, created_at, read_at' as const

async function fetchUnreadNotifications(userId: string): Promise<NotificationListItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .eq('recipient_id', userId)
    .is('read_at', null)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT)

  if (error) {
    throw error
  }

  return (data ?? []) as NotificationListItem[]
}

type NotificationsDropdownProps = {
  userId: string
  onMarkedAllRead?: () => void
}

export function NotificationsDropdown({ userId, onMarkedAllRead }: NotificationsDropdownProps) {
  const t = useTranslations('notifications')
  const [items, setItems] = useState<NotificationListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const loadItems = useCallback(async () => {
    try {
      const next = await fetchUnreadNotifications(userId)
      setItems(next)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'))
    } finally {
      setIsLoading(false)
    }
  }, [t, userId])

  useEffect(() => {
    setIsLoading(true)
    void loadItems()
  }, [loadItems])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications-dropdown-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationListItem & { archived_at?: string | null }
          if (!isUnreadNotification(row)) return

          setItems((current) => {
            if (current.some((item) => item.id === row.id)) {
              return current
            }
            return [row, ...current].slice(0, LIST_LIMIT)
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationListItem & { archived_at?: string | null }
          if (!isUnreadNotification(row)) {
            setItems((current) => current.filter((item) => item.id !== row.id))
            return
          }

          setItems((current) => {
            const without = current.filter((item) => item.id !== row.id)
            return [row, ...without].slice(0, LIST_LIMIT)
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      const result = await markAllAsRead()
      if (!result.ok) {
        setError(result.error)
        return
      }

      setItems([])
      setError(null)
      onMarkedAllRead?.()
    })
  }

  return (
    <div className="flex w-[min(100vw-2rem,24rem)] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
        {items.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-primary hover:text-primary"
            onClick={handleMarkAllAsRead}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
            {t('markAllAsRead')}
          </Button>
        ) : null}
      </div>

      <div className="max-h-[min(70vh,24rem)] overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-foreground/55">
            <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
            {t('loading')}
          </div>
        ) : error ? (
          <div className="px-3 py-8 text-center text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground/35">
              <BellOff className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm font-medium text-foreground">{t('emptyTitle')}</p>
            <p className="text-xs text-foreground/55">{t('emptyDescription')}</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((notification) => (
              <li key={notification.id}>
                <NotificationRow notification={notification} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
