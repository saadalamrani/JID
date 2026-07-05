'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useDebouncedValue } from '@/components/ui/combobox'
import {
  flattenCatalogPages,
  getCatalogTotalCount,
  useCatalogCompaniesInfinite,
} from '@/lib/hooks/use-catalog-companies-infinite'
import { useCatalogFiltersPersistence } from '@/lib/hooks/use-catalog-filters'
import { useCatalogRegions, useCatalogSectors } from '@/hooks/use-catalog-metadata'
import type {
  CatalogCompaniesResult,
  CatalogFilterState,
  CatalogRegionRef,
  CatalogSectorRef,
  CompanyCardData,
  OwnershipType,
} from '@/types/catalog'
import { catalogFilterStateToFilters } from '@/types/catalog'

type CatalogFilterContextValue = {
  filters: CatalogFilterState
  debouncedQ: string
  resultCount: number
  isLoading: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  isHydrated: boolean
  error: Error | null
  companies: CompanyCardData[]
  regions: CatalogRegionRef[]
  sectors: CatalogSectorRef[]
  setSearch: (q: string) => void
  toggleOwnership: (type: OwnershipType) => void
  toggleRegion: (slug: string) => void
  toggleSector: (slug: string) => void
  setSort: (sort: CatalogFilterState['sort']) => void
  removeOwnership: (type: OwnershipType) => void
  removeRegion: (slug: string) => void
  removeSector: (slug: string) => void
  clearSearch: () => void
  clearAll: () => void
  resetFilters: () => void
  hasActiveFilters: boolean
}

const CatalogFilterContext = createContext<CatalogFilterContextValue | null>(null)

type CatalogFilterProviderProps = {
  children: ReactNode
  initialData?: CatalogCompaniesResult
}

export function CatalogFilterProvider({ children, initialData }: CatalogFilterProviderProps) {
  const {
    filters,
    setFilters,
    resetFilters,
    isHydrated,
    wasRestoredFromStorage,
  } = useCatalogFiltersPersistence()

  const debouncedQ = useDebouncedValue(filters.q, 250)

  const queryFilters = useMemo(
    () => catalogFilterStateToFilters({ ...filters, q: debouncedQ }),
    [filters, debouncedQ],
  )

  const useServerInitialData = isHydrated && !wasRestoredFromStorage

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useCatalogCompaniesInfinite(queryFilters, {
    enabled: isHydrated,
    initialData: useServerInitialData ? initialData : undefined,
  })

  const { data: regions = [] } = useCatalogRegions()
  const { data: sectors = [] } = useCatalogSectors()

  const companies = useMemo(() => flattenCatalogPages(data?.pages), [data?.pages])
  const resultCount = getCatalogTotalCount(data?.pages) || initialData?.count || 0

  const toggleInList = useCallback(<T,>(list: T[], value: T): T[] => {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
  }, [])

  const setSearch = useCallback(
    (q: string) => {
      setFilters((prev) => ({ ...prev, q }))
    },
    [setFilters],
  )

  const toggleOwnership = useCallback(
    (type: OwnershipType) => {
      setFilters((prev) => ({
        ...prev,
        ownership: toggleInList(prev.ownership, type),
      }))
    },
    [setFilters, toggleInList],
  )

  const toggleRegion = useCallback(
    (slug: string) => {
      setFilters((prev) => ({
        ...prev,
        regions: toggleInList(prev.regions, slug),
      }))
    },
    [setFilters, toggleInList],
  )

  const toggleSector = useCallback(
    (slug: string) => {
      setFilters((prev) => ({
        ...prev,
        sectors: toggleInList(prev.sectors, slug),
      }))
    },
    [setFilters, toggleInList],
  )

  const setSort = useCallback(
    (sort: CatalogFilterState['sort']) => {
      setFilters((prev) => ({ ...prev, sort }))
    },
    [setFilters],
  )

  const removeOwnership = useCallback(
    (type: OwnershipType) => {
      setFilters((prev) => ({
        ...prev,
        ownership: prev.ownership.filter((item) => item !== type),
      }))
    },
    [setFilters],
  )

  const removeRegion = useCallback(
    (slug: string) => {
      setFilters((prev) => ({
        ...prev,
        regions: prev.regions.filter((item) => item !== slug),
      }))
    },
    [setFilters],
  )

  const removeSector = useCallback(
    (slug: string) => {
      setFilters((prev) => ({
        ...prev,
        sectors: prev.sectors.filter((item) => item !== slug),
      }))
    },
    [setFilters],
  )

  const clearSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, q: '' }))
  }, [setFilters])

  const clearAll = useCallback(() => {
    resetFilters()
  }, [resetFilters])

  const hasActiveFilters =
    Boolean(debouncedQ.trim()) ||
    filters.ownership.length > 0 ||
    filters.regions.length > 0 ||
    filters.sectors.length > 0

  const value = useMemo<CatalogFilterContextValue>(
    () => ({
      filters,
      debouncedQ,
      resultCount,
      isLoading,
      isFetching,
      isFetchingNextPage,
      hasNextPage: hasNextPage ?? false,
      fetchNextPage: () => {
        void fetchNextPage()
      },
      isHydrated,
      error: error as Error | null,
      companies,
      regions,
      sectors,
      setSearch,
      toggleOwnership,
      toggleRegion,
      toggleSector,
      setSort,
      removeOwnership,
      removeRegion,
      removeSector,
      clearSearch,
      clearAll,
      resetFilters,
      hasActiveFilters,
    }),
    [
      filters,
      debouncedQ,
      resultCount,
      isLoading,
      isFetching,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage,
      isHydrated,
      error,
      companies,
      regions,
      sectors,
      setSearch,
      toggleOwnership,
      toggleRegion,
      toggleSector,
      setSort,
      removeOwnership,
      removeRegion,
      removeSector,
      clearSearch,
      clearAll,
      resetFilters,
      hasActiveFilters,
    ],
  )

  return (
    <CatalogFilterContext.Provider value={value}>{children}</CatalogFilterContext.Provider>
  )
}

export function useCatalogFilters() {
  const context = useContext(CatalogFilterContext)
  if (!context) {
    throw new Error('useCatalogFilters must be used within CatalogFilterProvider')
  }
  return context
}
