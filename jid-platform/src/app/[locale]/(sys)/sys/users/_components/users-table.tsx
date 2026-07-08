'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/lib/i18n/navigation'
import type { SysUserListRow, SysUsersSortField } from '@/types/sys-users'
import { cn } from '@/lib/utils'

type UsersTableProps = {
  rows: SysUserListRow[]
  sort: SysUsersSortField
  dir: 'asc' | 'desc'
  baseParams: URLSearchParams
}

function SortHeader({
  label,
  field,
  currentSort,
  currentDir,
  baseParams,
}: {
  label: string
  field: SysUsersSortField
  currentSort: SysUsersSortField
  currentDir: 'asc' | 'desc'
  baseParams: URLSearchParams
}) {
  const pathname = usePathname()
  const nextDir = currentSort === field && currentDir === 'asc' ? 'desc' : 'asc'
  const params = new URLSearchParams(baseParams.toString())
  params.set('sort', field)
  params.set('dir', nextDir)
  const href = `${pathname}?${params.toString()}`

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1 font-medium hover:text-primary',
        currentSort === field && 'text-primary',
      )}
    >
      {label}
      {currentSort === field ? <span aria-hidden>{currentDir === 'asc' ? '↑' : '↓'}</span> : null}
    </Link>
  )
}

/** Section 8.1 — accessible sortable users table. */
export function UsersTable({ rows, sort, dir, baseParams }: UsersTableProps) {
  const t = useTranslations('sys.users.table')

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t('empty')}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="min-w-full text-sm">
        <thead className="bg-background/50 text-start">
          <tr>
            <th className="px-4 py-3">
              <SortHeader
                label={t('columns.name')}
                field="full_name"
                currentSort={sort}
                currentDir={dir}
                baseParams={baseParams}
              />
            </th>
            <th className="px-4 py-3">{t('columns.email')}</th>
            <th className="px-4 py-3">
              <SortHeader
                label={t('columns.role')}
                field="role"
                currentSort={sort}
                currentDir={dir}
                baseParams={baseParams}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label={t('columns.status')}
                field="status"
                currentSort={sort}
                currentDir={dir}
                baseParams={baseParams}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label={t('columns.lastLogin')}
                field="last_login_at"
                currentSort={sort}
                currentDir={dir}
                baseParams={baseParams}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label={t('columns.created')}
                field="created_at"
                currentSort={sort}
                currentDir={dir}
                baseParams={baseParams}
              />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-background/30">
              <td className="px-4 py-3">
                <Link href={`/sys/users/${row.id}`} className="font-medium text-primary hover:underline">
                  {row.full_name ?? t('unnamed')}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.email ?? '—'}</td>
              <td className="px-4 py-3">{t(`roleLabels.${row.display_role}`, { default: row.display_role })}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    row.is_suspended
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-primary/10 text-primary',
                  )}
                >
                  {row.is_suspended ? t('statuses.suspended') : t('statuses.active')}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.last_login_at ? new Date(row.last_login_at).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(row.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
