'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { track } from '@/lib/analytics/track'
import { useJobsQuery } from '@/lib/hooks/use-jobs-query'
import { useCatalogRegions, useCatalogSectors } from '@/hooks/use-catalog-metadata'
import type { CatalogRegionRef, CatalogSectorRef, OwnershipType } from '@/types/catalog'
import type {
  JobCardData,
  JobExperienceChipId,
  JobFilterState,
  JobsListResult,
  UrgencyFilter,
} from '@/types/job'
import {
  DEFAULT_JOB_FILTER_STATE,
  jobFilterStateToFilters,
} from '@/types/job'

type JobFilterContextValue = {
  filters: JobFilterState
  queryFilters: ReturnType<typeof jobFilterStateToFilters>
  resultCount: number
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  jobs: JobCardData[]
  regions: CatalogRegionRef[]
  sectors: CatalogSectorRef[]
  toggleExperienceChip: (chipId: JobExperienceChipId) => void
  toggleOwnership: (type: OwnershipType) => void
  toggleRegion: (slug: string) => void
  toggleSector: (slug: string) => void
  toggleUrgency: (value: UrgencyFilter) => void
  removeExperienceChip: (chipId: JobExperienceChipId) => void
  removeOwnership: (type: OwnershipType) => void
  removeRegion: (slug: string) => void
  removeSector: (slug: string) => void
  removeUrgency: (value: UrgencyFilter) => void
  clearAll: () => void
  hasActiveFilters: boolean
}

const JobFilterContext = createContext<JobFilterContextValue | null>(null)

type JobFilterProviderProps = {
  children: ReactNode
  initialData?: JobsListResult
}

export function JobFilterProvider({ children, initialData }: JobFilterProviderProps) {
  const [filters, setFilters] = useState<JobFilterState>(DEFAULT_JOB_FILTER_STATE)

  const queryFilters = useMemo(() => jobFilterStateToFilters(filters), [filters])

  const { data, isLoading, isFetching, error } = useJobsQuery(queryFilters, {
    initialData,
  })

  const { data: regions = [] } = useCatalogRegions()
  const { data: sectors = [] } = useCatalogSectors()

  const jobs = data?.jobs ?? []
  const resultCount = data?.count ?? initialData?.count ?? 0

  const filterTrackReady = useRef(false)
  useEffect(() => {
    if (!filterTrackReady.current) {
      filterTrackReady.current = true
      return
    }
    track('job_filter_applied', {
      experience_chips: filters.experienceChips,
      ownership: filters.ownership,
      regions: filters.regions,
      sectors: filters.sectors,
      urgency: filters.urgency,
      result_count: resultCount,
    })
  }, [filters, resultCount])

  const controls = useFilterControls(filters, setFilters)

  const hasActiveFilters =
    filters.experienceChips.length > 0 ||
    filters.ownership.length > 0 ||
    filters.regions.length > 0 ||
    filters.sectors.length > 0 ||
    filters.urgency.length > 0

  const value = useMemo<JobFilterContextValue>(
    () => ({
      filters,
      queryFilters,
      resultCount,
      isLoading,
      isFetching,
      error: error as Error | null,
      jobs,
      regions,
      sectors,
      ...controls,
      hasActiveFilters,
    }),
    [
      filters,
      queryFilters,
      resultCount,
      isLoading,
      isFetching,
      error,
      jobs,
      regions,
      sectors,
      controls,
      hasActiveFilters,
    ],
  )

  return <JobFilterContext.Provider value={value}>{children}</JobFilterContext.Provider>
}

type MandateFilterProviderProps = {
  children: ReactNode
  initialFilters?: JobFilterState
  onFiltersChange?: (filters: JobFilterState) => void
}

/** ابحثلي mandate sheet — reuses job-board filter components without jobs query. */
export function MandateFilterProvider({
  children,
  initialFilters,
  onFiltersChange,
}: MandateFilterProviderProps) {
  const [filters, setFilters] = useState<JobFilterState>(
    initialFilters ?? DEFAULT_JOB_FILTER_STATE,
  )

  useEffect(() => {
    onFiltersChange?.(filters)
  }, [filters, onFiltersChange])

  const { data: regions = [] } = useCatalogRegions()
  const { data: sectors = [] } = useCatalogSectors()
  const controls = useFilterControls(filters, setFilters)
  const queryFilters = useMemo(() => jobFilterStateToFilters(filters), [filters])

  const hasActiveFilters =
    filters.experienceChips.length > 0 ||
    filters.ownership.length > 0 ||
    filters.regions.length > 0 ||
    filters.sectors.length > 0

  const value = useMemo<JobFilterContextValue>(
    () => ({
      filters,
      queryFilters,
      resultCount: 0,
      isLoading: false,
      isFetching: false,
      error: null,
      jobs: [],
      regions,
      sectors,
      ...controls,
      hasActiveFilters,
    }),
    [filters, queryFilters, regions, sectors, controls, hasActiveFilters],
  )

  return <JobFilterContext.Provider value={value}>{children}</JobFilterContext.Provider>
}

function useFilterControls(
  filters: JobFilterState,
  setFilters: React.Dispatch<React.SetStateAction<JobFilterState>>,
) {
  const toggleInList = useCallback(<T,>(list: T[], value: T): T[] => {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
  }, [])

  const toggleExperienceChip = useCallback(
    (chipId: JobExperienceChipId) => {
      setFilters((prev) => ({
        ...prev,
        experienceChips: toggleInList(prev.experienceChips, chipId),
      }))
    },
    [setFilters, toggleInList],
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

  const toggleUrgency = useCallback(
    (value: UrgencyFilter) => {
      setFilters((prev) => ({
        ...prev,
        urgency: toggleInList(prev.urgency, value),
      }))
    },
    [setFilters, toggleInList],
  )

  const removeExperienceChip = useCallback(
    (chipId: JobExperienceChipId) => {
      setFilters((prev) => ({
        ...prev,
        experienceChips: prev.experienceChips.filter((item) => item !== chipId),
      }))
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

  const removeUrgency = useCallback(
    (value: UrgencyFilter) => {
      setFilters((prev) => ({
        ...prev,
        urgency: prev.urgency.filter((item) => item !== value),
      }))
    },
    [setFilters],
  )

  const clearAll = useCallback(() => {
    setFilters(DEFAULT_JOB_FILTER_STATE)
  }, [setFilters])

  return useMemo(
    () => ({
      toggleExperienceChip,
      toggleOwnership,
      toggleRegion,
      toggleSector,
      toggleUrgency,
      removeExperienceChip,
      removeOwnership,
      removeRegion,
      removeSector,
      removeUrgency,
      clearAll,
    }),
    [
      toggleExperienceChip,
      toggleOwnership,
      toggleRegion,
      toggleSector,
      toggleUrgency,
      removeExperienceChip,
      removeOwnership,
      removeRegion,
      removeSector,
      removeUrgency,
      clearAll,
    ],
  )
}

export function useJobFilters() {
  const context = useContext(JobFilterContext)
  if (!context) {
    throw new Error('useJobFilters must be used within JobFilterProvider')
  }
  return context
}
