'use client'

import { useLocale } from 'next-intl'
import type { SysEmailBounceRow } from '@/lib/sys/notifications-health-queries'
import { formatDateTime } from '@/lib/utils/format'

type BouncesTableProps = {
  bounces: SysEmailBounceRow[]
  columns: {
    email: string
    type: string
    count: string
    firstSeen: string
    lastSeen: string
    empty: string
  }
}

export function BouncesTable({ bounces, columns }: BouncesTableProps) {
  const locale = useLocale()

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="min-w-full text-sm">
        <thead className="bg-background/50 text-start">
          <tr>
            <th className="px-4 py-3 font-medium">{columns.email}</th>
            <th className="px-4 py-3 font-medium">{columns.type}</th>
            <th className="px-4 py-3 font-medium">{columns.count}</th>
            <th className="px-4 py-3 font-medium">{columns.firstSeen}</th>
            <th className="px-4 py-3 font-medium">{columns.lastSeen}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {bounces.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                {columns.empty}
              </td>
            </tr>
          ) : (
            bounces.map((bounce) => (
              <tr key={bounce.id}>
                <td className="px-4 py-3 font-medium text-foreground">{bounce.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                    {bounce.bounce_type}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums">{bounce.bounce_count}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {formatDateTime(bounce.first_bounced_at, locale)}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {formatDateTime(bounce.last_bounced_at, locale)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
