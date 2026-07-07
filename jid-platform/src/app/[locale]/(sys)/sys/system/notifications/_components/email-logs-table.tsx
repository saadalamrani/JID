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
      return 'bg-jid-olive/10 text-jid-olive'
    case 'failed':
      return 'bg-red-100 text-red-700'
    case 'skipped_bounced':
    case 'skipped_prefs':
    case 'skipped_quota':
      return 'bg-amber-100 text-amber-800'
    default:
      return 'bg-jid-beige/60 text-jid-ink/70'
  }
}

export function EmailLogsTable({ logs, columns }: EmailLogsTableProps) {
  const locale = useLocale()

  return (
    <div className="overflow-x-auto rounded-lg border border-jid-line bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-jid-beige/50 text-start">
          <tr>
            <th className="px-4 py-3 font-medium">{columns.destination}</th>
            <th className="px-4 py-3 font-medium">{columns.status}</th>
            <th className="px-4 py-3 font-medium">{columns.category}</th>
            <th className="px-4 py-3 font-medium">{columns.attempted}</th>
            <th className="px-4 py-3 font-medium">{columns.sent}</th>
            <th className="px-4 py-3 font-medium">{columns.error}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-jid-line">
          {logs.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-jid-ink/50">
                {columns.empty}
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-jid-ink">{log.recipient_email}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-jid-ink/45">{log.recipient_id}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(log.status)}`}
                  >
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-jid-ink/75">{log.category ?? '—'}</td>
                <td className="px-4 py-3 tabular-nums text-jid-ink/70">
                  {log.attempted_at ? formatDateTime(log.attempted_at, locale) : '—'}
                </td>
                <td className="px-4 py-3 tabular-nums text-jid-ink/70">
                  {log.sent_at ? formatDateTime(log.sent_at, locale) : '—'}
                </td>
                <td className="max-w-xs px-4 py-3 text-xs text-red-700">
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
