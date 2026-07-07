'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { AuditLogRow } from '@/lib/auth/audit-logs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type RecentActionsFeedProps = {
  actions: AuditLogRow[]
}

/** Section 6.1 — read-only feed of the staff member's last 15 audit events. */
export function RecentActionsFeed({ actions }: RecentActionsFeedProps) {
  const t = useTranslations('staff.dashboard.recentActions')

  return (
    <Card className="border-jid-line bg-white">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </div>
        <Link href="/staff/audit" className="text-sm font-medium text-jid-olive hover:underline">
          {t('viewAll')}
        </Link>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <p className="py-6 text-center text-sm text-jid-ink/50">{t('empty')}</p>
        ) : (
          <ul className="divide-y divide-jid-line">
            {actions.map((action) => (
              <li key={action.id} className="py-3 first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-jid-ink">{action.action}</p>
                    <p className="truncate text-xs text-jid-ink/55">
                      {action.entity_type}
                      {action.entity_id ? ` · ${action.entity_id.slice(0, 8)}` : ''}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-xs text-jid-ink/45"
                    dateTime={action.created_at}
                  >
                    {new Date(action.created_at).toLocaleString()}
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
