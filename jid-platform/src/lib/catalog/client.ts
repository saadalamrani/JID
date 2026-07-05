import { createClient } from '@/lib/supabase/client'
import type {
  CatalogCompaniesResult,
  CatalogFilters,
  CatalogRegionRef,
  CatalogSectorRef,
} from '@/types/catalog'
import { buildCatalogSearchParams } from '@/types/catalog'

export async function fetchCatalogCompanies(
  filters: CatalogFilters,
): Promise<CatalogCompaniesResult> {
  const params = buildCatalogSearchParams(filters)
  const response = await fetch(`/api/catalog?${params.toString()}`)

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Catalog fetch failed')
  }

  return response.json() as Promise<CatalogCompaniesResult>
}

export async function fetchCatalogRegions(): Promise<CatalogRegionRef[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('regions')
    .select('slug, name_en, name_ar')
    .order('name_ar', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as CatalogRegionRef[]
}

export async function fetchCatalogSectors(): Promise<CatalogSectorRef[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sectors')
    .select('slug, name_en, name_ar')
    .order('display_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as CatalogSectorRef[]
}

export function catalogCompaniesQueryKey(filters: CatalogFilters) {
  return ['catalog', 'companies', filters] as const
}

export function catalogRegionsQueryKey() {
  return ['catalog', 'regions'] as const
}

export function catalogSectorsQueryKey() {
  return ['catalog', 'sectors'] as const
}
