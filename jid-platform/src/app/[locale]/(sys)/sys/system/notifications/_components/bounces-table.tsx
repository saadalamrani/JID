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
    <div className="overflow-x-auto rounded-lg border border-jid-line bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-jid-beige/50 text-start">
          <tr>
            <th className="px-4 py-3 font-medium">{columns.email}</th>
            <th className="px-4 py-3 font-medium">{columns.type}</th>
            <th className="px-4 py-3 font-medium">{columns.count}</th>
            <th className="px-4 py-3 font-medium">{columns.firstSeen}</th>
            <th className="px-4 py-3 font-medium">{columns.lastSeen}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-jid-line">
          {bounces.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-jid-ink/50">
                {columns.empty}
              </td>
            </tr>
          ) : (
            bounces.map((bounce) => (
              <tr key={bounce.id}>
                <td className="px-4 py-3 font-medium text-jid-ink">{bounce.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    {bounce.bounce_type}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums">{bounce.bounce_count}</td>
                <td className="px-4 py-3 tabular-nums text-jid-ink/70">
                  {formatDateTime(bounce.first_bounced_at, locale)}
                </td>
                <td className="px-4 py-3 tabular-nums text-jid-ink/70">
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
