import { getTranslations } from 'next-intl/server'
import { NotificationRow } from '@/components/notifications/notification-row'
import type { NotificationPageItem } from '@/lib/notifications/types'

type NotificationsListProps = {
  notifications: NotificationPageItem[]
}

export async function NotificationsList({ notifications }: NotificationsListProps) {
  const t = await getTranslations('notifications.page')

  if (notifications.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">{t('emptyTitle')}</p>
        <p className="mt-1 text-xs text-foreground/55">{t('emptyDescription')}</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-jid-line overflow-hidden rounded-lg border border-border bg-card">
      {notifications.map((notification) => (
        <li key={notification.id}>
          <NotificationRow notification={notification} variant="page" />
        </li>
      ))}
    </ul>
  )
}
