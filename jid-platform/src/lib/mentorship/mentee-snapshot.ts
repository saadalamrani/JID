import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { MenteeSnapshot } from '@/types/mentorship-request'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>
type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: Client): UntypedClient {
  return client as unknown as UntypedClient
}

const PROFILE_SNAPSHOT_SELECT = `
  id,
  full_name,
  headline,
  avatar_url,
  university_id,
  college_id,
  target_sectors,
  target_program_types,
  target_regions
` as const

type ProfileSnapshotRow = {
  id: string
  full_name: string | null
  headline: string | null
  avatar_url: string | null
  university_id: string | null
  college_id: string | null
  target_sectors: string[]
  target_program_types: string[]
  target_regions: string[]
}

async function resolveUniversityName(
  client: UntypedClient,
  universityId: string | null,
  locale: string,
): Promise<string | null> {
  if (!universityId) return null
  const { data } = await client
    .from('universities')
    .select('name, name_ar')
    .eq('id', universityId)
    .maybeSingle()
  if (!data) return null
  const row = data as { name: string; name_ar: string | null }
  return locale === 'ar' && row.name_ar ? row.name_ar : row.name
}

async function resolveCollegeName(
  client: UntypedClient,
  collegeId: string | null,
  locale: string,
): Promise<string | null> {
  if (!collegeId) return null
  const { data } = await client
    .from('colleges')
    .select('name, name_ar')
    .eq('id', collegeId)
    .maybeSingle()
  if (!data) return null
  const row = data as { name: string; name_ar: string | null }
  return locale === 'ar' && row.name_ar ? row.name_ar : row.name
}

export async function buildMenteeSnapshot(
  profile: ProfileSnapshotRow,
  options?: { locale?: string; client?: Client },
): Promise<MenteeSnapshot> {
  const supabase = options?.client ?? (await createClient())
  const client = asUntyped(supabase)
  const locale = options?.locale ?? 'ar'

  const [university, college] = await Promise.all([
    resolveUniversityName(client, profile.university_id, locale),
    resolveCollegeName(client, profile.college_id, locale),
  ])

  return {
    captured_at: new Date().toISOString(),
    full_name: profile.full_name,
    headline: profile.headline,
    avatar_url: profile.avatar_url,
    university,
    college,
    city: profile.target_regions[0] ?? null,
    target_sectors: profile.target_sectors ?? [],
    target_program_types: profile.target_program_types ?? [],
  }
}

export async function fetchMenteeSnapshotForUser(
  userId: string,
  locale = 'ar',
): Promise<MenteeSnapshot | null> {
  const supabase = await createClient()
  const client = asUntyped(supabase)

  const { data, error } = await client
    .from('profiles')
    .select(PROFILE_SNAPSHOT_SELECT)
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null
  return buildMenteeSnapshot(data as ProfileSnapshotRow, { locale, client: supabase })
}
