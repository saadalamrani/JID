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
      <p className="rounded-lg border border-dashed border-jid-line p-8 text-center text-sm text-jid-ink/50">
        {t('empty')}
      </p>
    )
  }

  return (
    <ul className="divide-y divide-jid-line rounded-lg border border-jid-line bg-white">
      {announcements.map((item) => {
        const status = resolveStatus(item)
        return (
          <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-jid-ink" dir="rtl">
                  {item.title_ar}
                </p>
                <StatusBadge status={status} label={t(`status.${status}`)} />
                <span className="rounded bg-jid-beige/70 px-2 py-0.5 text-[11px] text-jid-ink/60">
                  {t(`categories.${item.category}`)}
                </span>
                {item.is_featured ? (
                  <span className="rounded bg-jid-gold/30 px-2 py-0.5 text-[11px] font-medium text-jid-ink">
                    {t('featured')}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-jid-ink/50">
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
        status === 'published' && 'bg-emerald-100 text-emerald-800',
        status === 'draft' && 'bg-jid-beige text-jid-ink/70',
        status === 'scheduled' && 'bg-blue-100 text-blue-800',
        status === 'expired' && 'bg-red-100 text-red-800',
      )}
    >
      {label}
    </span>
  )
}
