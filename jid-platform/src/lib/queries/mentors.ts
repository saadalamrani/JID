import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { throwQueryError } from '@/lib/supabase/offline-error'
import { parseActiveWorkshopJson } from '@/lib/mentor/workshop'
import type {
  MentorCardData,
  MentorDiscoveryStats,
  MentorFilters,
  MentorPublicDetail,
  MentorsListResult,
} from '@/types/mentor'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Section 4.3 / Section 10 — public-safe columns only.
 * Excludes: application_message, rejection_reason, reviewed_by, reviewed_at,
 * linkedin_url, declined_requests_count, application_submitted_at, etc.
 */
export const MENTOR_PUBLIC_SELECT = `
  user_id,
  slug,
  headline,
  bio_short,
  expertise_areas,
  expertise_sectors,
  specializations,
  languages,
  nationality,
  years_experience,
  rating_avg,
  sessions_count,
  is_accepting_requests,
  is_mentor_of_month,
  active_workshop,
  profiles!mentor_profiles_user_id_fkey(full_name, avatar_url)
` as const

export const MENTOR_DETAIL_SELECT = `
  user_id,
  slug,
  headline,
  bio_short,
  bio_long,
  expertise_areas,
  expertise_sectors,
  specializations,
  languages,
  preferred_mediums,
  nationality,
  years_experience,
  rating_avg,
  sessions_count,
  is_accepting_requests,
  is_mentor_of_month,
  active_workshop,
  career_history,
  profiles!mentor_profiles_user_id_fkey(full_name, avatar_url)
` as const

type MentorListRow = {
  user_id: string
  slug: string | null
  headline: string | null
  bio_short: string | null
  bio_long?: string | null
  expertise_areas: string[]
  expertise_sectors: string[]
  specializations: string[]
  languages: string[]
  preferred_mediums?: string[]
  nationality: string | null
  years_experience: number | null
  rating_avg: number | null
  sessions_count: number
  is_accepting_requests: boolean
  is_mentor_of_month: boolean
  active_workshop: unknown
  career_history?: unknown
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

function parseCareerHistory(raw: unknown): MentorPublicDetail['career_history'] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is MentorPublicDetail['career_history'][number] => {
    return item !== null && typeof item === 'object'
  })
}

function mapMentorCard(row: MentorListRow): MentorCardData {
  return {
    user_id: row.user_id,
    slug: row.slug,
    full_name: row.profiles?.full_name ?? null,
    avatar_url: row.profiles?.avatar_url ?? null,
    headline: row.headline,
    bio_short: row.bio_short,
    expertise_areas: row.expertise_areas ?? [],
    expertise_sectors: row.expertise_sectors ?? [],
    specializations: row.specializations ?? [],
    languages: row.languages ?? [],
    nationality: row.nationality,
    years_experience: row.years_experience,
    rating_avg: row.rating_avg,
    sessions_count: row.sessions_count ?? 0,
    is_accepting_requests: row.is_accepting_requests,
    is_mentor_of_month: row.is_mentor_of_month ?? false,
    active_workshop: parseActiveWorkshopJson(row.active_workshop),
  }
}

function mapMentorDetail(row: MentorListRow): MentorPublicDetail {
  return {
    ...mapMentorCard(row),
    bio_long: row.bio_long ?? null,
    preferred_mediums: row.preferred_mediums ?? [],
    career_history: parseCareerHistory(row.career_history),
  }
}

export async function fetchMentorDiscoveryStats(
  client?: Client,
): Promise<MentorDiscoveryStats> {
  const supabase = client ?? (await createClient())

  const { count, error: countError } = await supabase
    .from('mentor_profiles')
    .select('user_id', { count: 'exact', head: true })
    .eq('status', 'approved')
    .eq('is_accepting_requests', true)

  if (countError) {
    throwQueryError(countError)
  }

  const { data: sessionRows, error: sessionsError } = await supabase
    .from('mentor_profiles')
    .select('sessions_count')
    .eq('status', 'approved')
    .eq('is_accepting_requests', true)

  if (sessionsError) {
    throwQueryError(sessionsError)
  }

  const totalSessionsCount = (sessionRows ?? []).reduce(
    (sum, row) => sum + (row.sessions_count ?? 0),
    0,
  )

  return {
    activeMentorCount: count ?? 0,
    totalSessionsCount,
  }
}

export async function fetchMentors(filters: MentorFilters): Promise<MentorsListResult> {
  const supabase = await createClient()
  const stats = await fetchMentorDiscoveryStats(supabase)

  const from = (filters.page - 1) * filters.limit
  const to = from + filters.limit - 1

  let query = supabase
    .from('mentor_profiles')
    .select(MENTOR_PUBLIC_SELECT, { count: 'exact' })
    .eq('status', 'approved')
    .order('rating_avg', { ascending: false, nullsFirst: false })
    .order('sessions_count', { ascending: false })
    .range(from, to)

  if (filters.accepting_only) {
    query = query.eq('is_accepting_requests', true)
  }

  if (filters.sectors.length > 0) {
    query = query.overlaps('expertise_sectors', filters.sectors)
  }

  if (filters.expertise_areas.length > 0) {
    query = query.overlaps('expertise_areas', filters.expertise_areas)
  }

  if (filters.specializations.length > 0) {
    query = query.overlaps('specializations', filters.specializations)
  }

  if (filters.languages.length > 0) {
    query = query.overlaps('languages', filters.languages)
  }

  if (filters.nationalities.length > 0) {
    query = query.in('nationality', filters.nationalities)
  }

  const { data, error, count } = await query

  if (error) {
    throwQueryError(error)
  }

  const mentors = ((data ?? []) as MentorListRow[]).map(mapMentorCard)

  return {
    mentors,
    count: count ?? mentors.length,
    stats,
  }
}

/** Section 4.15 — top mentors by mentor_score for homepage (score not exposed publicly). */
export async function fetchFeaturedMentorsByScore(limit = 3): Promise<MentorCardData[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mentor_profiles')
    .select(MENTOR_PUBLIC_SELECT)
    .eq('status', 'approved')
    .order('mentor_score', { ascending: false, nullsFirst: false })
    .order('rating_avg', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    const { data: fallback, error: fallbackError } = await supabase
      .from('mentor_profiles')
      .select(MENTOR_PUBLIC_SELECT)
      .eq('status', 'approved')
      .order('is_mentor_of_month', { ascending: false })
      .order('rating_avg', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (fallbackError) throwQueryError(fallbackError)
    return ((fallback ?? []) as MentorListRow[]).map(mapMentorCard)
  }

  return ((data ?? []) as MentorListRow[]).map(mapMentorCard)
}

export async function fetchMentorBySlug(slug: string): Promise<MentorPublicDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mentor_profiles')
    .select(MENTOR_DETAIL_SELECT)
    .eq('status', 'approved')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throwQueryError(error)
  if (!data) return null
  return mapMentorDetail(data as MentorListRow)
}

export async function fetchMentorPublicByUserId(userId: string): Promise<MentorPublicDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mentor_profiles')
    .select(MENTOR_DETAIL_SELECT)
    .eq('status', 'approved')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throwQueryError(error)
  if (!data) return null
  return mapMentorDetail(data as MentorListRow)
}

export function isMentorPublicIdentifier(value: string): boolean {
  return UUID_RE.test(value)
}

export async function fetchMentorPublicByIdentifier(
  identifier: string,
): Promise<MentorPublicDetail | null> {
  if (isMentorPublicIdentifier(identifier)) {
    return fetchMentorPublicByUserId(identifier)
  }
  return fetchMentorBySlug(identifier)
}
