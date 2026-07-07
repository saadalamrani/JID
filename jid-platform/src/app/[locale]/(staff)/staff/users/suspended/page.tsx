import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { UsersFilters } from '@/app/[locale]/(staff)/staff/users/_components/users-filters'
import { UsersTable } from '@/app/[locale]/(staff)/staff/users/_components/users-table'
import { fetchStaffUsersList } from '@/lib/staff/users-queries'
import type { StaffUserRoleFilter } from '@/types/staff-users'

type SuspendedUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/** Section 8 — currently suspended individuals/mentors (staff may reinstate). */
export default async function SuspendedUsersPage({ searchParams }: SuspendedUsersPageProps) {
  const params = await searchParams
  const t = await getTranslations('staff.users.suspended')

  const filters = {
    q: readParam(params.q),
    role: (readParam(params.role) as StaffUserRoleFilter) ?? 'all',
    status: 'suspended' as const,
    page: Number.parseInt(readParam(params.page) ?? '1', 10) || 1,
  }

  const result = await fetchStaffUsersList(filters)

  const listParams = new URLSearchParams()
  if (filters.q) listParams.set('q', filters.q)
  if (filters.role && filters.role !== 'all') listParams.set('role', filters.role)

  return (
    <div className="space-y-6">
      <header>
        <Link href="/staff/users" className="text-sm text-jid-olive hover:underline">
          {t('back')}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-1 text-sm text-jid-ink/70">{t('subtitle')}</p>
      </header>

      <Suspense fallback={<div className="h-24 rounded-lg border border-jid-line bg-white" />}>
        <UsersFilters basePath="/staff/users/suspended" lockStatus="suspended" />
      </Suspense>

      <UsersTable rows={result.rows} />

      <p className="text-sm text-jid-ink/60">
        {t('count', { total: result.total, page: result.page, totalPages: result.totalPages })}
      </p>
    </div>
  )
}
