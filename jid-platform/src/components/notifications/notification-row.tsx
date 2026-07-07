'use client'

import { formatDistance } from 'date-fns'
import { arSA } from 'date-fns/locale'
import { useLocale } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { CategoryIcon } from '@/components/notifications/category-icon'
import type { NotificationListItem, NotificationRowVariant } from '@/lib/notifications/types'
import { formatRelativeTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

type NotificationRowProps = {
  notification: NotificationListItem
  className?: string
  variant?: NotificationRowVariant
}

function localizedText(locale: string, ar: string, en: string): string {
  return locale === 'ar' ? ar : en
}

function formatPageDistance(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return formatDistance(date, new Date(), { addSuffix: true, locale: arSA })
}

export function NotificationRow({
  notification,
  className,
  variant = 'dropdown',
}: NotificationRowProps) {
  const locale = useLocale()
  const title = localizedText(locale, notification.title_ar, notification.title_en)
  const body = localizedText(locale, notification.body_ar, notification.body_en)
  const actionLabel = notification.action_url
    ? localizedText(
        locale,
        notification.action_label_ar ?? 'عرض',
        notification.action_label_en ?? 'View',
      )
    : null
  const isUnread = notification.read_at == null
  const isPage = variant === 'page'

  const timeLabel = isPage
    ? formatPageDistance(notification.created_at)
    : formatRelativeTime(notification.created_at, locale)

  const unreadBulletClass = isPage ? 'bg-amber-500' : 'bg-jid-olive'
  const unreadSurfaceClass = isPage ? 'bg-jid-gold/5' : 'bg-jid-beige/25'

  const content = (
    <div className="flex gap-3">
      <CategoryIcon category={notification.category} priority={notification.priority} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm leading-snug text-jid-ink',
              isUnread ? 'font-semibold' : 'font-medium',
            )}
          >
            {title}
          </p>
          {isUnread ? (
            <span
              className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', unreadBulletClass)}
              aria-hidden
            />
          ) : null}
        </div>
        <p
          className={cn(
            'mt-0.5 text-xs leading-relaxed text-jid-ink/65',
            isPage ? 'line-clamp-3' : 'line-clamp-2',
          )}
        >
          {body}
        </p>
        <p className="mt-1.5 text-[11px] tabular-nums text-jid-ink/45">{timeLabel}</p>
        {actionLabel ? (
          <p className="mt-1 text-xs font-medium text-jid-olive">{actionLabel}</p>
        ) : null}
      </div>
    </div>
  )

  const rowClassName = cn(
    isPage ? 'block px-4 py-4 transition-colors hover:bg-jid-beige/30' : 'rounded-lg px-3 py-2.5',
    !isPage && 'transition-colors hover:bg-jid-beige/50',
    isUnread ? unreadSurfaceClass : isPage ? 'bg-white' : 'bg-transparent',
    className,
  )

  if (notification.action_url) {
    return (
      <Link href={notification.action_url} className={rowClassName}>
        {content}
      </Link>
    )
  }

  return <div className={rowClassName}>{content}</div>
}
