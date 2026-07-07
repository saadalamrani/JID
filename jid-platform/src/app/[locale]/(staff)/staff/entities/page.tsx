import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { EntitiesFilters } from '@/app/[locale]/(staff)/staff/entities/_components/entities-filters'
import { EntitiesTable } from '@/app/[locale]/(staff)/staff/entities/_components/entities-table'
import {
  fetchStaffEntitiesList,
  fetchStaffRegionOptions,
} from '@/lib/staff/entities-queries'
import type { StaffOwnershipFilter } from '@/types/staff-entities'

type StaffEntitiesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/** Section 9 — approved companies + universities moderation list. */
export default async function StaffEntitiesPage({ searchParams }: StaffEntitiesPageProps) {
  const params = await searchParams
  const t = await getTranslations('staff.entities')

  const filters = {
    q: readParam(params.q),
    ownership: (readParam(params.ownership) as StaffOwnershipFilter) ?? 'all',
    regionId: readParam(params.region),
    page: Number.parseInt(readParam(params.page) ?? '1', 10) || 1,
  }

  const [result, regions] = await Promise.all([
    fetchStaffEntitiesList(filters),
    fetchStaffRegionOptions(),
  ])

  const listParams = new URLSearchParams()
  if (filters.q) listParams.set('q', filters.q)
  if (filters.ownership && filters.ownership !== 'all') listParams.set('ownership', filters.ownership)
  if (filters.regionId) listParams.set('region', filters.regionId)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
          <p className="mt-1 text-sm text-jid-ink/70">{t('subtitle')}</p>
        </div>
        <Link href="/staff/entities/flagged" className="text-sm text-jid-olive hover:underline">
          {t('flaggedLink')}
        </Link>
      </header>

      <Suspense fallback={<div className="h-24 rounded-lg border border-jid-line bg-white" />}>
        <EntitiesFilters regions={regions} />
      </Suspense>

      <EntitiesTable rows={result.rows} />

      <p className="text-sm text-jid-ink/60">
        {t('pagination.summary', { total: result.total, page: result.page, totalPages: result.totalPages })}
      </p>
    </div>
  )
}
