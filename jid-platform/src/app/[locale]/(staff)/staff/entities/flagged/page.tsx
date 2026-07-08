import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { EntitiesFilters } from '@/app/[locale]/(staff)/staff/entities/_components/entities-filters'
import { EntitiesTable } from '@/app/[locale]/(staff)/staff/entities/_components/entities-table'
import { STAFF_COMMITMENT_FLAG_THRESHOLD } from '@/lib/staff/entity-constants'
import {
  fetchStaffFlaggedEntities,
  fetchStaffRegionOptions,
} from '@/lib/staff/entities-queries'
import type { StaffOwnershipFilter } from '@/types/staff-entities'

type FlaggedEntitiesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/** Section 9 — entities with commitment_score below SLA threshold. */
export default async function FlaggedEntitiesPage({ searchParams }: FlaggedEntitiesPageProps) {
  const params = await searchParams
  const t = await getTranslations('staff.entities.flagged')

  const filters = {
    q: readParam(params.q),
    ownership: (readParam(params.ownership) as StaffOwnershipFilter) ?? 'all',
    regionId: readParam(params.region),
    page: Number.parseInt(readParam(params.page) ?? '1', 10) || 1,
  }

  const [result, regions] = await Promise.all([
    fetchStaffFlaggedEntities(filters),
    fetchStaffRegionOptions(),
  ])

  return (
    <div className="space-y-6">
      <header>
        <Link href="/staff/entities" className="text-sm text-primary hover:underline">
          {t('back')}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('subtitle', { threshold: STAFF_COMMITMENT_FLAG_THRESHOLD })}
        </p>
      </header>

      <Suspense fallback={<div className="h-24 rounded-lg border border-border bg-card" />}>
        <EntitiesFilters basePath="/staff/entities/flagged" regions={regions} />
      </Suspense>

      <EntitiesTable rows={result.rows} />

      <p className="text-sm text-muted-foreground">
        {t('count', { total: result.total, page: result.page, totalPages: result.totalPages })}
      </p>
    </div>
  )
}
