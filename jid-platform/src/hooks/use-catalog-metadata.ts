'use client'

import { useQuery } from '@tanstack/react-query'
import {
  catalogRegionsQueryKey,
  catalogSectorsQueryKey,
  fetchCatalogRegions,
  fetchCatalogSectors,
} from '@/lib/catalog/client'

const STALE_MS = 10 * 60 * 1000

export function useCatalogRegions() {
  return useQuery({
    queryKey: catalogRegionsQueryKey(),
    queryFn: fetchCatalogRegions,
    staleTime: STALE_MS,
    gcTime: STALE_MS * 2,
    refetchOnWindowFocus: false,
  })
}

export function useCatalogSectors() {
  return useQuery({
    queryKey: catalogSectorsQueryKey(),
    queryFn: fetchCatalogSectors,
    staleTime: STALE_MS,
    gcTime: STALE_MS * 2,
    refetchOnWindowFocus: false,
  })
}
