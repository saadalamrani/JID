'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useMentorsQuery } from '@/lib/hooks/use-mentors-query'
import { useCatalogSectors } from '@/hooks/use-catalog-metadata'
import type {
  MentorFilterState,
  MentorsListResult,
} from '@/types/mentor'
import {
  DEFAULT_MENTOR_FILTER_STATE,
  mentorFilterStateToFilters,
} from '@/types/mentor'

type MentorFilterContextValue = {
  filters: MentorFilterState
  resultCount: number
  stats: MentorsListResult['stats']
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  mentors: MentorsListResult['mentors']
  sectors: ReturnType<typeof useCatalogSectors>['data']
  expertiseAreaOptions: string[]
  toggleSector: (slug: string) => void
  toggleExpertiseArea: (value: string) => void
  toggleSpecialization: (value: string) => void
  toggleLanguage: (value: string) => void
  toggleNationality: (value: string) => void
  setAcceptingOnly: (value: boolean) => void
  clearAll: () => void
  hasActiveFilters: boolean
  desiredFilters: MentorFilterState
}

const MentorFilterContext = createContext<MentorFilterContextValue | null>(null)

type MentorFilterProviderProps = {
  children: ReactNode
  initialData?: MentorsListResult
}

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export function MentorFilterProvider({ children, initialData }: MentorFilterProviderProps) {
  const [filters, setFilters] = useState<MentorFilterState>(DEFAULT_MENTOR_FILTER_STATE)

  const queryFilters = useMemo(() => mentorFilterStateToFilters(filters), [filters])

  const { data, isLoading, isFetching, error } = useMentorsQuery(queryFilters, {
    initialData,
  })

  const { data: sectors = [] } = useCatalogSectors()

  const mentors = useMemo(
    () => data?.mentors ?? initialData?.mentors ?? [],
    [data?.mentors, initialData?.mentors],
  )
  const resultCount = data?.count ?? initialData?.count ?? 0
  const stats = data?.stats ?? initialData?.stats ?? {
    activeMentorCount: 0,
    totalSessionsCount: 0,
  }

  const expertiseAreaOptions = useMemo(() => {
    const values = new Set<string>()
    for (const mentor of mentors) {
      for (const area of mentor.expertise_areas) {
        if (area.trim()) values.add(area)
      }
    }
  for (const area of filters.expertise_areas) {
      values.add(area)
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'ar'))
  }, [mentors, filters.expertise_areas])

  const toggleSector = useCallback((slug: string) => {
    setFilters((prev) => ({ ...prev, sectors: toggleInList(prev.sectors, slug) }))
  }, [])

  const toggleExpertiseArea = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      expertise_areas: toggleInList(prev.expertise_areas, value),
    }))
  }, [])

  const toggleSpecialization = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      specializations: toggleInList(prev.specializations, value),
    }))
  }, [])

  const toggleLanguage = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      languages: toggleInList(prev.languages, value),
    }))
  }, [])

  const toggleNationality = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      nationalities: toggleInList(prev.nationalities, value),
    }))
  }, [])

  const setAcceptingOnly = useCallback((value: boolean) => {
    setFilters((prev) => ({ ...prev, accepting_only: value }))
  }, [])

  const clearAll = useCallback(() => {
    setFilters(DEFAULT_MENTOR_FILTER_STATE)
  }, [])

  const hasActiveFilters =
    filters.sectors.length > 0 ||
    filters.expertise_areas.length > 0 ||
    filters.specializations.length > 0 ||
    filters.languages.length > 0 ||
    filters.nationalities.length > 0 ||
    filters.accepting_only

  const value: MentorFilterContextValue = {
    filters,
    resultCount,
    stats,
    isLoading,
    isFetching,
    error: error ?? null,
    mentors,
    sectors,
    expertiseAreaOptions,
    toggleSector,
    toggleExpertiseArea,
    toggleSpecialization,
    toggleLanguage,
    toggleNationality,
    setAcceptingOnly,
    clearAll,
    hasActiveFilters,
    desiredFilters: filters,
  }

  return <MentorFilterContext.Provider value={value}>{children}</MentorFilterContext.Provider>
}

export function useMentorFilters() {
  const context = useContext(MentorFilterContext)
  if (!context) {
    throw new Error('useMentorFilters must be used within MentorFilterProvider')
  }
  return context
}
