import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'

export type MentorApplicationQueueItem = {
  user_id: string
  slug: string | null
  status: string
  headline: string | null
  bio_long: string | null
  expertise_areas: string[]
  languages: string[]
  preferred_mediums: string[]
  linkedin_url: string | null
  years_experience: number | null
  career_history: Json
  application_submitted_at: string | null
  applicant_name: string | null
  applicant_avatar_url: string | null
}

export type MentorApplicationsQueueStats = {
  pending: number
}

type MentorProfileRow = {
  user_id: string
  slug: string | null
  status: string
  headline: string | null
  bio_long: string | null
  expertise_areas: string[]
  languages: string[]
  preferred_mediums: string[]
  linkedin_url: string | null
  years_experience: number | null
  career_history: Json
  application_submitted_at: string | null
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

export async function listPendingMentorApplications(): Promise<{
  applications: MentorApplicationQueueItem[]
  stats: MentorApplicationsQueueStats
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mentor_profiles')
    .select(
      `
      user_id,
      slug,
      status,
      headline,
      bio_long,
      expertise_areas,
      languages,
      preferred_mediums,
      linkedin_url,
      years_experience,
      career_history,
      application_submitted_at,
      profiles!mentor_profiles_user_id_fkey(full_name, avatar_url)
    `,
    )
    .eq('status', 'pending_review')
    .order('application_submitted_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as MentorProfileRow[]
  const applications = rows.map((row) => ({
    user_id: row.user_id,
    slug: row.slug,
    status: row.status,
    headline: row.headline,
    bio_long: row.bio_long,
    expertise_areas: row.expertise_areas ?? [],
    languages: row.languages ?? [],
    preferred_mediums: row.preferred_mediums ?? [],
    linkedin_url: row.linkedin_url,
    years_experience: row.years_experience,
    career_history: row.career_history,
    application_submitted_at: row.application_submitted_at,
    applicant_name: row.profiles?.full_name ?? null,
    applicant_avatar_url: row.profiles?.avatar_url ?? null,
  }))

  return {
    applications,
    stats: { pending: applications.length },
  }
}

export async function getMentorApplicationByUserId(
  userId: string,
): Promise<MentorApplicationQueueItem | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mentor_profiles')
    .select(
      `
      user_id,
      slug,
      status,
      headline,
      bio_long,
      expertise_areas,
      languages,
      preferred_mediums,
      linkedin_url,
      years_experience,
      career_history,
      application_submitted_at,
      profiles!mentor_profiles_user_id_fkey(full_name, avatar_url)
    `,
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const row = data as MentorProfileRow
  return {
    user_id: row.user_id,
    slug: row.slug,
    status: row.status,
    headline: row.headline,
    bio_long: row.bio_long,
    expertise_areas: row.expertise_areas ?? [],
    languages: row.languages ?? [],
    preferred_mediums: row.preferred_mediums ?? [],
    linkedin_url: row.linkedin_url,
    years_experience: row.years_experience,
    career_history: row.career_history,
    application_submitted_at: row.application_submitted_at,
    applicant_name: row.profiles?.full_name ?? null,
    applicant_avatar_url: row.profiles?.avatar_url ?? null,
  }
}
