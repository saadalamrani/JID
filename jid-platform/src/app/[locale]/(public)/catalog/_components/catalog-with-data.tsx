import { getLocale } from 'next-intl/server'
import { fetchCompanies } from '@/lib/queries/catalog'
import { dbOfflineHint, isDbOfflineError } from '@/lib/supabase/offline-error'
import { DEFAULT_CATALOG_FILTERS, type CatalogCompaniesResult } from '@/types/catalog'
import { CatalogPageClient } from './catalog-page-client'

export async function CatalogWithData() {
  const locale = await getLocale()
  const emptyData: CatalogCompaniesResult = {
    companies: [],
    count: 0,
    page: DEFAULT_CATALOG_FILTERS.page ?? 1,
    limit: DEFAULT_CATALOG_FILTERS.limit ?? 50,
  }

  let initialData = emptyData
  let setupHint: string | undefined

  try {
    initialData = await fetchCompanies(DEFAULT_CATALOG_FILTERS)
  } catch (error) {
    if (isDbOfflineError(error)) {
      setupHint = dbOfflineHint(locale)
    } else {
      throw error
    }
  }

  return <CatalogPageClient initialData={initialData} setupHint={setupHint} />
}
