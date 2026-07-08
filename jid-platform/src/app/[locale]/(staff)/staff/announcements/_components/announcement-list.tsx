'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { AnnouncementRow } from '@/lib/announcements/queries'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AnnouncementListProps = {
  announcements: AnnouncementRow[]
}

export function AnnouncementList({ announcements }: AnnouncementListProps) {
  const t = useTranslations('staff.announcements.list')

  if (announcements.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {t('empty')}
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {announcements.map((item) => {
        const status = resolveStatus(item)
        return (
          <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground" dir="rtl">
                  {item.title_ar}
                </p>
                <StatusBadge status={status} label={t(`status.${status}`)} />
                <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {t(`categories.${item.category}`)}
                </span>
                {item.is_featured ? (
                  <span className="rounded bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-foreground">
                    {t('featured')}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('schedule', {
                  start: new Date(item.starts_at).toLocaleString(),
                  end: new Date(item.expires_at).toLocaleString(),
                })}
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/staff/announcements/${item.id}/edit`}>{t('edit')}</Link>
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

function resolveStatus(item: AnnouncementRow): 'draft' | 'published' | 'scheduled' | 'expired' {
  const now = Date.now()
  if (!item.is_published) return 'draft'
  if (new Date(item.expires_at).getTime() <= now) return 'expired'
  if (new Date(item.starts_at).getTime() > now) return 'scheduled'
  return 'published'
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[11px] font-medium',
        status === 'published' && 'bg-primary/10 text-primary',
        status === 'draft' && 'bg-background text-muted-foreground',
        status === 'scheduled' && 'bg-blue-100 text-blue-800',
        status === 'expired' && 'bg-destructive/10 text-destructive',
      )}
    >
      {label}
    </span>
  )
}
