'use client'

import { useLocale } from 'next-intl'
import type { SysEmailSendLogRow } from '@/lib/sys/notifications-health-queries'
import { formatDateTime } from '@/lib/utils/format'

type EmailLogsTableProps = {
  logs: SysEmailSendLogRow[]
  columns: {
    destination: string
    status: string
    category: string
    attempted: string
    sent: string
    error: string
    empty: string
  }
}

function statusClass(status: string): string {
  switch (status) {
    case 'sent':
      return 'bg-primary/10 text-primary'
    case 'failed':
      return 'bg-destructive/10 text-destructive'
    case 'skipped_bounced':
    case 'skipped_prefs':
    case 'skipped_quota':
      return 'bg-sem-warning/10 text-sem-warning'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function EmailLogsTable({ logs, columns }: EmailLogsTableProps) {
  const locale = useLocale()

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="min-w-full text-sm">
        <thead className="bg-background/50 text-start">
          <tr>
            <th className="px-4 py-3 font-medium">{columns.destination}</th>
            <th className="px-4 py-3 font-medium">{columns.status}</th>
            <th className="px-4 py-3 font-medium">{columns.category}</th>
            <th className="px-4 py-3 font-medium">{columns.attempted}</th>
            <th className="px-4 py-3 font-medium">{columns.sent}</th>
            <th className="px-4 py-3 font-medium">{columns.error}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {logs.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                {columns.empty}
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{log.recipient_email}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{log.recipient_id}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(log.status)}`}
                  >
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{log.category ?? '—'}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {log.attempted_at ? formatDateTime(log.attempted_at, locale) : '—'}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {log.sent_at ? formatDateTime(log.sent_at, locale) : '—'}
                </td>
                <td className="max-w-xs px-4 py-3 text-xs text-destructive">
                  {log.error_message ?? '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
