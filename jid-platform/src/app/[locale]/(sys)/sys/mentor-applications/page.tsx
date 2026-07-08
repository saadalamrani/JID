import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { MentorApplicationActions } from '@/app/[locale]/(sys)/sys/mentor-applications/_components/mentor-application-actions'
import { MentorApplicationsFilters } from '@/app/[locale]/(sys)/sys/mentor-applications/_components/mentor-applications-filters'
import { fetchSysMentorApplications } from '@/lib/sys/mentor-applications-queries'
import type { SysMentorApplicationsFilters } from '@/types/sys-mentor-applications'

type SysMentorApplicationsPageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function SysMentorApplicationsPage({ searchParams }: SysMentorApplicationsPageProps) {
  const t = await getTranslations('sys.mentorApplications')

  const filters: SysMentorApplicationsFilters = {
    q: readParam(searchParams.q),
    status: (readParam(searchParams.status) as SysMentorApplicationsFilters['status']) ?? 'all',
    page: Number.parseInt(readParam(searchParams.page) ?? '1', 10) || 1,
  }

  const result = await fetchSysMentorApplications(filters)

  const listParams = new URLSearchParams()
  if (filters.q) listParams.set('q', filters.q)
  if (filters.status && filters.status !== 'all') listParams.set('status', filters.status)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t('staffNote')}</p>
      </header>

      <Suspense fallback={<div className="h-24 rounded-lg border border-border bg-card" />}>
        <MentorApplicationsFilters />
      </Suspense>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-background/50 text-start">
            <tr>
              <th className="px-4 py-3 font-medium">{t('table.applicant')}</th>
              <th className="px-4 py-3 font-medium">{t('table.headline')}</th>
              <th className="px-4 py-3 font-medium">{t('table.submitted')}</th>
              <th className="px-4 py-3 font-medium">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  {t('table.empty')}
                </td>
              </tr>
            ) : (
              result.rows.map((row) => (
                <tr key={row.user_id} className="hover:bg-background/30">
                  <td className="px-4 py-3">
                    <Link href={`/sys/users/${row.user_id}`} className="font-medium text-primary hover:underline">
                      {row.applicant_name ?? t('table.unnamed')}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.headline ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.application_submitted_at
                      ? new Date(row.application_submitted_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <MentorApplicationActions application={row} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>{t('pagination.summary', { total: result.total, page: result.page, totalPages: result.totalPages })}</p>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Link
              href={`/sys/mentor-applications?${new URLSearchParams({ ...Object.fromEntries(listParams), page: String(result.page - 1) }).toString()}`}
              className="text-primary hover:underline"
            >
              {t('pagination.prev')}
            </Link>
          ) : null}
          {result.page < result.totalPages ? (
            <Link
              href={`/sys/mentor-applications?${new URLSearchParams({ ...Object.fromEntries(listParams), page: String(result.page + 1) }).toString()}`}
              className="text-primary hover:underline"
            >
              {t('pagination.next')}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
