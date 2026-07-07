import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { EntitiesFilters } from '@/app/[locale]/(sys)/sys/entities/_components/entities-filters'
import { EntitiesTable } from '@/app/[locale]/(sys)/sys/entities/_components/entities-table'
import { fetchSysEntitiesList } from '@/lib/sys/entities-queries'
import type { SysEntitiesListFilters, SysEntityTypeFilter } from '@/types/sys-entities'

type SysEntitiesPageProps = {
  searchParams: Record<string, string | string[] | undefined>
  entityType?: SysEntityTypeFilter
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

async function EntitiesListContent({
  searchParams,
  entityType = 'all',
}: SysEntitiesPageProps) {
  const t = await getTranslations('sys.entities')

  const filters: SysEntitiesListFilters = {
    q: readParam(searchParams.q),
    entityType,
    state: (readParam(searchParams.state) as SysEntitiesListFilters['state']) ?? 'all',
    page: Number.parseInt(readParam(searchParams.page) ?? '1', 10) || 1,
  }

  const result = await fetchSysEntitiesList(filters)

  const listParams = new URLSearchParams()
  if (filters.q) listParams.set('q', filters.q)
  if (filters.state && filters.state !== 'all') listParams.set('state', filters.state)

  const basePath =
    entityType === 'company'
      ? '/sys/entities/companies'
      : entityType === 'university'
        ? '/sys/entities/universities'
        : '/sys/entities'

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-jid-ink">
          {entityType === 'company'
            ? t('companiesTitle')
            : entityType === 'university'
              ? t('universitiesTitle')
              : t('title')}
        </h1>
        <p className="mt-1 text-sm text-jid-ink/70">
          {entityType === 'all' ? t('subtitle') : t('filteredSubtitle')}
        </p>
        {entityType === 'all' ? (
          <div className="mt-3 flex gap-3 text-sm">
            <Link href="/sys/entities/companies" className="text-jid-olive hover:underline">
              {t('viewCompanies')}
            </Link>
            <Link href="/sys/entities/universities" className="text-jid-olive hover:underline">
              {t('viewUniversities')}
            </Link>
          </div>
        ) : (
          <Link href="/sys/entities" className="mt-3 inline-block text-sm text-jid-olive hover:underline">
            {t('viewAll')}
          </Link>
        )}
      </header>

      <Suspense fallback={<div className="h-24 rounded-lg border border-jid-line bg-white" />}>
        <EntitiesFilters fixedEntityType={entityType} />
      </Suspense>

      <EntitiesTable rows={result.rows} />

      <div className="flex items-center justify-between text-sm text-jid-ink/60">
        <p>{t('pagination.summary', { total: result.total, page: result.page, totalPages: result.totalPages })}</p>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Link
              href={`${basePath}?${new URLSearchParams({ ...Object.fromEntries(listParams), page: String(result.page - 1) }).toString()}`}
              className="text-jid-olive hover:underline"
            >
              {t('pagination.prev')}
            </Link>
          ) : null}
          {result.page < result.totalPages ? (
            <Link
              href={`${basePath}?${new URLSearchParams({ ...Object.fromEntries(listParams), page: String(result.page + 1) }).toString()}`}
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

export default async function SysEntitiesPage(props: SysEntitiesPageProps) {
  return <EntitiesListContent {...props} entityType="all" />
}

export { EntitiesListContent }
