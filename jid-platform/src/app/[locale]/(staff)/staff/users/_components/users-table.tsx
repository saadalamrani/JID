'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { StaffUserListRow } from '@/types/staff-users'
import { cn } from '@/lib/utils'

type UsersTableProps = {
  rows: StaffUserListRow[]
}

/** Section 8 — bounded users table (individuals and mentors only). */
export function UsersTable({ rows }: UsersTableProps) {
  const t = useTranslations('staff.users.table')

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-jid-line bg-white p-8 text-center text-sm text-jid-ink/50">
        {t('empty')}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-jid-line bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-jid-beige/50 text-start">
          <tr>
            <th className="px-4 py-3 font-medium">{t('columns.name')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.email')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.role')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.status')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.lastLogin')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.created')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-jid-line">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-jid-beige/30">
              <td className="px-4 py-3">
                <Link
                  href={`/staff/users/${row.id}`}
                  className="font-medium text-jid-olive hover:underline"
                >
                  {row.full_name ?? t('unnamed')}
                </Link>
              </td>
              <td className="px-4 py-3 text-jid-ink/70">{row.email ?? '—'}</td>
              <td className="px-4 py-3">{t(`roleLabels.${row.display_role}`)}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    row.is_suspended
                      ? 'bg-red-100 text-red-700'
                      : 'bg-emerald-50 text-emerald-700',
                  )}
                >
                  {row.is_suspended ? t('statuses.suspended') : t('statuses.active')}
                </span>
              </td>
              <td className="px-4 py-3 text-jid-ink/70">
                {row.last_login_at ? new Date(row.last_login_at).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3 text-jid-ink/70">
                {new Date(row.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
