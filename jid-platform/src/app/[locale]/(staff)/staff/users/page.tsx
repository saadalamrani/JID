import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { UsersFilters } from '@/app/[locale]/(staff)/staff/users/_components/users-filters'
import { UsersTable } from '@/app/[locale]/(staff)/staff/users/_components/users-table'
import { fetchStaffUsersList } from '@/lib/staff/users-queries'
import type { StaffUserRoleFilter, StaffUserStatusFilter } from '@/types/staff-users'

type StaffUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/** Section 8 — bounded user list (individual + mentor display roles only). */
export default async function StaffUsersPage({ searchParams }: StaffUsersPageProps) {
  const params = await searchParams
  const t = await getTranslations('staff.users')

  const filters = {
    q: readParam(params.q),
    role: (readParam(params.role) as StaffUserRoleFilter) ?? 'all',
    status: (readParam(params.status) as StaffUserStatusFilter) ?? 'all',
    page: Number.parseInt(readParam(params.page) ?? '1', 10) || 1,
  }

  const result = await fetchStaffUsersList(filters)

  const listParams = new URLSearchParams()
  if (filters.q) listParams.set('q', filters.q)
  if (filters.role && filters.role !== 'all') listParams.set('role', filters.role)
  if (filters.status && filters.status !== 'all') listParams.set('status', filters.status)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
          <p className="mt-1 text-sm text-jid-ink/70">{t('subtitle')}</p>
        </div>
        <Link
          href="/staff/users/suspended"
          className="text-sm text-jid-olive hover:underline"
        >
          {t('suspendedLink')}
        </Link>
      </header>

      <Suspense fallback={<div className="h-24 rounded-lg border border-jid-line bg-white" />}>
        <UsersFilters />
      </Suspense>

      <UsersTable rows={result.rows} />

      <div className="flex items-center justify-between text-sm text-jid-ink/60">
        <p>{t('pagination.summary', { total: result.total, page: result.page, totalPages: result.totalPages })}</p>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Link
              href={`/staff/users?${new URLSearchParams({ ...Object.fromEntries(listParams), page: String(result.page - 1) }).toString()}`}
              className="text-jid-olive hover:underline"
            >
              {t('pagination.prev')}
            </Link>
          ) : null}
          {result.page < result.totalPages ? (
            <Link
              href={`/staff/users?${new URLSearchParams({ ...Object.fromEntries(listParams), page: String(result.page + 1) }).toString()}`}
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
