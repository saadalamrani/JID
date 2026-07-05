import { fetchCompanies } from '@/lib/queries/catalog'
import { DEFAULT_CATALOG_FILTERS } from '@/types/catalog'
import { CatalogPageClient } from './catalog-page-client'

export async function CatalogWithData() {
  const initialData = await fetchCompanies(DEFAULT_CATALOG_FILTERS)
  return <CatalogPageClient initialData={initialData} />
}
