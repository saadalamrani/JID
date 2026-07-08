'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { RecentAuditActivity } from '@/types/sys-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type RecentActivityProps = {
  events: RecentAuditActivity[]
}

/** Section 6.1 — last 10 audit events with actor names. */
export function RecentActivity({ events }: RecentActivityProps) {
  const t = useTranslations('sys.dashboard.recentActivity')

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </div>
        <Link href="/sys/audit" className="text-sm font-medium text-primary hover:underline">
          {t('viewAll')}
        </Link>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id} className="py-3 first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{event.action}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {event.actor_name ?? t('systemActor')} · {event.entity_type}
                      {event.entity_id ? ` · ${event.entity_id.slice(0, 8)}` : ''}
                    </p>
                  </div>
                  <time
                    dateTime={event.created_at}
                    className="shrink-0 text-xs text-muted-foreground"
                  >
                    {new Date(event.created_at).toLocaleString()}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
