import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { UsersFilters } from '@/app/[locale]/(sys)/sys/users/_components/users-filters'
import { UsersTable } from '@/app/[locale]/(sys)/sys/users/_components/users-table'
import { fetchSysUsersList } from '@/lib/sys/users-queries'
import type { SysUsersListFilters, SysUsersSortField } from '@/types/sys-users'

type SysUsersPageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/** Section 8.1 — all roles, search, filters, pagination. */
export default async function SysUsersPage({ searchParams }: SysUsersPageProps) {
  const t = await getTranslations('sys.users')

  const filters: SysUsersListFilters = {
    q: readParam(searchParams.q),
    role: (readParam(searchParams.role) as SysUsersListFilters['role']) ?? 'all',
    status: (readParam(searchParams.status) as SysUsersListFilters['status']) ?? 'all',
    page: Number.parseInt(readParam(searchParams.page) ?? '1', 10) || 1,
    sort: (readParam(searchParams.sort) as SysUsersSortField) ?? 'created_at',
    dir: readParam(searchParams.dir) === 'asc' ? 'asc' : 'desc',
  }

  const result = await fetchSysUsersList(filters)

  const listParams = new URLSearchParams()
  if (filters.q) listParams.set('q', filters.q)
  if (filters.role && filters.role !== 'all') listParams.set('role', filters.role)
  if (filters.status && filters.status !== 'all') listParams.set('status', filters.status)
  if (filters.sort) listParams.set('sort', filters.sort)
  if (filters.dir) listParams.set('dir', filters.dir)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-1 text-sm text-jid-ink/70">{t('subtitle')}</p>
      </header>

      <Suspense fallback={<div className="h-24 rounded-lg border border-jid-line bg-white" />}>
        <UsersFilters />
      </Suspense>

      <UsersTable
        rows={result.rows}
        sort={filters.sort ?? 'created_at'}
        dir={filters.dir ?? 'desc'}
        baseParams={listParams}
      />

      <div className="flex items-center justify-between text-sm text-jid-ink/60">
        <p>{t('pagination.summary', { total: result.total, page: result.page, totalPages: result.totalPages })}</p>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Link
              href={`/sys/users?${new URLSearchParams({ ...Object.fromEntries(listParams), page: String(result.page - 1) }).toString()}`}
              className="text-jid-olive hover:underline"
            >
              {t('pagination.prev')}
            </Link>
          ) : null}
          {result.page < result.totalPages ? (
            <Link
              href={`/sys/users?${new URLSearchParams({ ...Object.fromEntries(listParams), page: String(result.page + 1) }).toString()}`}
              className="text-jid-olive hover:underline"
            >
              {t('pagination.next')}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
