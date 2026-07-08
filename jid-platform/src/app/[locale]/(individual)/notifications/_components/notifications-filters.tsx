'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/lib/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { NOTIFICATION_CATEGORIES } from '@/lib/notifications/categories'
import type { NotificationStatusFilter } from '@/lib/notifications/queries'
import { cn } from '@/lib/utils'

type NotificationsFiltersProps = {
  className?: string
}

function readStatus(searchParams: URLSearchParams): NotificationStatusFilter {
  const value = searchParams.get('status')
  if (value === 'unread' || value === 'archived') return value
  return 'all'
}

function readCategory(searchParams: URLSearchParams): string {
  return searchParams.get('category') ?? 'all'
}

/** URL-synced status + category filters for the notifications workspace. */
export function NotificationsFilters({ className }: NotificationsFiltersProps) {
  const t = useTranslations('notifications.filters')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const status = readStatus(searchParams)
  const category = readCategory(searchParams)

  function replaceParams(partial: { status?: NotificationStatusFilter; category?: string }) {
    const next = new URLSearchParams(searchParams.toString())
    const nextStatus = partial.status ?? status
    const nextCategory = partial.category ?? category

    if (nextStatus === 'all') {
      next.delete('status')
    } else {
      next.set('status', nextStatus)
    }

    if (!nextCategory || nextCategory === 'all') {
      next.delete('category')
    } else {
      next.set('category', nextCategory)
    }

    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className={cn('space-y-4 rounded-lg border border-border bg-card p-4', className)}>
      <FilterGroup label={t('statusLabel')}>
        {(['all', 'unread', 'archived'] as const).map((value) => (
          <FilterButton
            key={value}
            active={status === value}
            onClick={() => replaceParams({ status: value })}
          >
            {t(`status.${value}`)}
          </FilterButton>
        ))}
      </FilterGroup>

      <div className="space-y-1.5">
        <label htmlFor="notifications-category-filter" className="text-xs font-medium text-muted-foreground">
          {t('categoryLabel')}
        </label>
        <select
          id="notifications-category-filter"
          value={category}
          onChange={(event) => replaceParams({ category: event.target.value })}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 sm:max-w-md"
        >
          <option value="all">{t('categoryAll')}</option>
          {NOTIFICATION_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {t(`categories.${value}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:bg-background/50',
      )}
    >
      {children}
    </button>
  )
}
