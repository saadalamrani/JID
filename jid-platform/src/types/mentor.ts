/**
 * Mentor discovery types — Section 4.3
 */

import type { ParsedActiveWorkshop } from '@/lib/mentor/workshop'
import type { CatalogSectorRef } from '@/types/catalog'

/** Public-safe mentor card — Section 4.4. */
export type MentorCardData = {
  user_id: string
  slug: string | null
  full_name: string | null
  avatar_url: string | null
  headline: string | null
  bio_short: string | null
  expertise_areas: string[]
  expertise_sectors: string[]
  specializations: string[]
  languages: string[]
  nationality: string | null
  years_experience: number | null
  rating_avg: number | null
  sessions_count: number
  is_accepting_requests: boolean
  is_mentor_of_month: boolean
  active_workshop: ParsedActiveWorkshop | null
}

/** Section 4.7 — public mentor profile detail. */
export type MentorPublicDetail = MentorCardData & {
  bio_long: string | null
  preferred_mediums: string[]
  career_history: Array<{
    title?: string
    company?: string
    start_year?: number
    end_year?: number | null
    description?: string
  }>
}

export type MentorDiscoveryStats = {
  activeMentorCount: number
  totalSessionsCount: number
}

export type MentorFilters = {
  sectors: string[]
  expertise_areas: string[]
  specializations: string[]
  languages: string[]
  nationalities: string[]
  /** When true, only mentors with is_accepting_requests = true. */
  accepting_only: boolean
  page: number
  limit: number
}

export type MentorsListResult = {
  mentors: MentorCardData[]
  count: number
  stats: MentorDiscoveryStats
}

export type MentorFilterState = {
  sectors: string[]
  expertise_areas: string[]
  specializations: string[]
  languages: string[]
  nationalities: string[]
  accepting_only: boolean
}

export type MentorNotificationDesiredFilters = Pick<
  MentorFilterState,
  'sectors' | 'expertise_areas' | 'specializations' | 'languages' | 'nationalities' | 'accepting_only'
>

export const DEFAULT_MENTOR_FILTER_STATE: MentorFilterState = {
  sectors: [],
  expertise_areas: [],
  specializations: [],
  languages: [],
  nationalities: [],
  accepting_only: false,
}

export const DEFAULT_MENTOR_FILTERS: MentorFilters = {
  ...DEFAULT_MENTOR_FILTER_STATE,
  page: 1,
  limit: 100,
}

export const MENTOR_LIST_LIMIT = 100

export function mentorFilterStateToFilters(state: MentorFilterState): Omit<MentorFilters, 'page' | 'limit'> {
  return {
    sectors: state.sectors,
    expertise_areas: state.expertise_areas,
    specializations: state.specializations,
    languages: state.languages,
    nationalities: state.nationalities,
    accepting_only: state.accepting_only,
  }
}

function parseCsvParam(value: string | null): string[] {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function parseMentorFiltersFromSearchParams(params: URLSearchParams): MentorFilters {
  return {
    sectors: parseCsvParam(params.get('sectors')),
    expertise_areas: parseCsvParam(params.get('expertise_areas')),
    specializations: parseCsvParam(params.get('specializations')),
    languages: parseCsvParam(params.get('languages')),
    nationalities: parseCsvParam(params.get('nationalities')),
    accepting_only: params.get('accepting_only') === 'true',
    page: Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1),
    limit: Math.min(
      MENTOR_LIST_LIMIT,
      Math.max(1, Number.parseInt(params.get('limit') ?? String(MENTOR_LIST_LIMIT), 10) || MENTOR_LIST_LIMIT),
    ),
  }
}

export function buildMentorSearchParams(
  filters: MentorFilters,
): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.sectors.length) params.set('sectors', filters.sectors.join(','))
  if (filters.expertise_areas.length) params.set('expertise_areas', filters.expertise_areas.join(','))
  if (filters.specializations.length) params.set('specializations', filters.specializations.join(','))
  if (filters.languages.length) params.set('languages', filters.languages.join(','))
  if (filters.nationalities.length) params.set('nationalities', filters.nationalities.join(','))
  if (filters.accepting_only) params.set('accepting_only', 'true')
  params.set('page', String(filters.page))
  params.set('limit', String(filters.limit))
  return params
}

export type { CatalogSectorRef }
