import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/server'

type Client = SupabaseClient<Database>

export type OwnerUniversityProfile = Database['public']['Tables']['university_profiles']['Row'] & {
  directory_logo_url: string | null
  directory_name_ar: string | null
  directory_slug: string | null
}

/**
 * Spec 05-B DEF-07 / DEF-03 — status-aware owner row including suspended
 * (fetchOwnerUniversityProfile excludes suspended for normal owner surfaces).
 */
export async function fetchOwnerUniversityProfileRow(
  client: Client,
  userId: string,
): Promise<{ id: string; status: string } | null> {
  const { data, error } = await client
    .from('university_profiles')
    .select('id, status')
    .eq('owner_user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Spec 05-B — owned university Profile for authenticated owner routes.
 * Filters `owner_user_id` to the session user supplied by the server caller;
 * never trust a client-supplied arbitrary user id from the browser.
 */
export async function fetchOwnerUniversityProfile(
  client: Client,
  userId: string,
): Promise<OwnerUniversityProfile | null> {
  const { data: profile, error } = await client
    .from('university_profiles')
    .select('*')
    .eq('owner_user_id', userId)
    .neq('status', 'suspended')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!profile) return null

  const { data: directory } = await client
    .from('companies')
    .select('logo_url, name_ar, slug')
    .eq('id', profile.directory_id)
    .maybeSingle()

  const directoryRow = directory as {
    logo_url: string | null
    name_ar: string | null
    slug: string | null
  } | null

  return {
    ...profile,
    directory_logo_url: directoryRow?.logo_url ?? null,
    directory_name_ar: directoryRow?.name_ar ?? null,
    directory_slug: directoryRow?.slug ?? null,
  }
}

export async function getOwnerUniversityProfileForUser(
  userId: string,
): Promise<OwnerUniversityProfile | null> {
  const supabase = await createClient()
  return fetchOwnerUniversityProfile(supabase, userId)
}
