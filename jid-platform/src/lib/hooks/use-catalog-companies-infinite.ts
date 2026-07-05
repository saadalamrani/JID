'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchCatalogCompanies } from '@/lib/catalog/client'
import type { CatalogCompaniesResult, CatalogFilters } from '@/types/catalog'
import { CATALOG_PAGE_SIZE } from '@/types/catalog'

export function catalogCompaniesInfiniteQueryKey(filters: Omit<CatalogFilters, 'page' | 'limit'>) {
  return ['catalog', 'companies', 'infinite', filters] as const
}

type UseCatalogCompaniesInfiniteOptions = {
  initialData?: CatalogCompaniesResult
  enabled?: boolean
}

export function useCatalogCompaniesInfinite(
  filters: Omit<CatalogFilters, 'page' | 'limit'>,
  options: UseCatalogCompaniesInfiniteOptions = {},
) {
  const { enabled = true, initialData } = options

  return useInfiniteQuery({
    queryKey: catalogCompaniesInfiniteQueryKey(filters),
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchCatalogCompanies({
        ...filters,
        page: pageParam,
        limit: CATALOG_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.limit
      if (loaded < lastPage.count) return lastPage.page + 1
      return undefined
    },
    initialData: initialData
      ? {
          pages: [initialData],
          pageParams: [1],
        }
      : undefined,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

export function flattenCatalogPages(
  pages: CatalogCompaniesResult[] | undefined,
): CatalogCompaniesResult['companies'] {
  if (!pages?.length) return []
  return pages.flatMap((page) => page.companies)
}

export function getCatalogTotalCount(pages: CatalogCompaniesResult[] | undefined): number {
  return pages?.[0]?.count ?? 0
}
