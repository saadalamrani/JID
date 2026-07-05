'use client'

import { useQuery } from '@tanstack/react-query'
import {
  catalogCompaniesQueryKey,
  fetchCatalogCompanies,
} from '@/lib/catalog/client'
import type { CatalogCompaniesResult, CatalogFilters } from '@/types/catalog'

type UseCatalogCompaniesOptions = {
  initialData?: CatalogCompaniesResult
}

export function useCatalogCompanies(
  filters: CatalogFilters,
  options: UseCatalogCompaniesOptions = {},
) {
  return useQuery({
    queryKey: catalogCompaniesQueryKey(filters),
    queryFn: () => fetchCatalogCompanies(filters),
    initialData: options.initialData,
    placeholderData: (previous) => previous,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
