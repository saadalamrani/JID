import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type MentorHubKpis = {
  pendingCount: number
  activeChatsCount: number
  upcomingMeetingsCount: number
  ratingAvg: number | null
}

export async function fetchMentorHubKpis(mentorId: string): Promise<MentorHubKpis> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const [pendingRes, chatsRes, meetingsRes, profileRes] = await Promise.all([
    supabase
      .from('mentorship_requests')
      .select('id', { count: 'exact', head: true })
      .eq('mentor_id', mentorId)
      .eq('status', 'pending'),
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('mentor_id', mentorId),
    supabase
      .from('mentorship_meetings')
      .select('id', { count: 'exact', head: true })
      .eq('mentor_id', mentorId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_at', now),
    supabase
      .from('mentor_profiles')
      .select('rating_avg')
      .eq('user_id', mentorId)
      .maybeSingle(),
  ])

  if (pendingRes.error) throw new Error(pendingRes.error.message)
  if (chatsRes.error) throw new Error(chatsRes.error.message)
  if (meetingsRes.error) throw new Error(meetingsRes.error.message)
  if (profileRes.error) throw new Error(profileRes.error.message)

  return {
    pendingCount: pendingRes.count ?? 0,
    activeChatsCount: chatsRes.count ?? 0,
    upcomingMeetingsCount: meetingsRes.count ?? 0,
    ratingAvg: profileRes.data?.rating_avg ?? null,
  }
}

export type MentorHubSettings = {
  is_accepting_requests: boolean
  bio_long: string | null
  expertise_areas: string[]
  preferred_mediums: string[]
  slug: string | null
  full_name: string | null
  avatar_url: string | null
  rating_avg: number | null
  sessions_count: number
  is_mentor_of_month: boolean
}

export async function fetchMentorHubSettings(mentorId: string): Promise<MentorHubSettings | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mentor_profiles')
    .select(
      'is_accepting_requests, bio_long, expertise_areas, preferred_mediums, slug, rating_avg, sessions_count, is_mentor_of_month, profiles!mentor_profiles_user_id_fkey(full_name, avatar_url)',
    )
    .eq('user_id', mentorId)
    .eq('status', 'approved')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles

  return {
    is_accepting_requests: data.is_accepting_requests,
    bio_long: data.bio_long,
    expertise_areas: data.expertise_areas ?? [],
    preferred_mediums: data.preferred_mediums ?? [],
    slug: data.slug,
    full_name: profile?.full_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
    rating_avg: data.rating_avg != null ? Number(data.rating_avg) : null,
    sessions_count: data.sessions_count ?? 0,
    is_mentor_of_month: data.is_mentor_of_month ?? false,
  }
}
