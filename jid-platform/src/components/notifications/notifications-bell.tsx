'use client'

import { useTranslations } from 'next-intl'
import { Bell } from 'lucide-react'
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown'
import { useUnreadCount } from '@/components/notifications/use-unread-count'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type NotificationsBellProps = {
  userId: string | null | undefined
  className?: string
}

function formatBadgeCount(count: number): string {
  if (count > 99) return '99+'
  return String(count)
}

export function NotificationsBell({ userId, className }: NotificationsBellProps) {
  const t = useTranslations('notifications')
  const { count, refresh } = useUnreadCount(userId)

  if (!userId) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'relative rounded-lg border border-jid-line bg-jid-beige/30 p-2 text-jid-ink/70 transition-colors hover:bg-jid-beige/60',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive/40',
            className,
          )}
          aria-label={t('bellAria', { count })}
        >
          <Bell className="h-4 w-4" aria-hidden />
          {count > 0 ? (
            <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-jid-olive px-1 text-[10px] font-semibold leading-none text-white">
              {formatBadgeCount(count)}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <NotificationsDropdown userId={userId} onMarkedAllRead={() => void refresh()} />
      </PopoverContent>
    </Popover>
  )
}
