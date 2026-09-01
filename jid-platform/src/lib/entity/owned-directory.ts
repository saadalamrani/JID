import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type OwnedDirectory = {
  id: string
  name: string
  name_ar: string | null
  entity_type: string
  is_verified: boolean
  is_active: boolean
  logo_url: string | null
  cover_url: string | null
  description_ar: string | null
  description_en: string | null
  tagline_ar: string | null
  tagline_en: string | null
  slug: string | null
}

async function loadDirectory(directoryId: string): Promise<OwnedDirectory | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .select(
      'id, name, name_ar, entity_type, is_verified, is_active, logo_url, cover_url, description_ar, description_en, tagline_ar, tagline_en, slug',
    )
    .eq('id', directoryId)
    .maybeSingle()

  if (error || !data) return null
  return data
}

/** Resolve the Directory row for a user who owns a Business or University workspace. */
export async function fetchOwnedDirectoryForUser(userId: string): Promise<OwnedDirectory | null> {
  const supabase = await createClient()

  const { data: business } = await supabase
    .from('business_profiles')
    .select('directory_id, status')
    .eq('owner_user_id', userId)
    .neq('status', 'suspended')
    .maybeSingle()

  if (business?.directory_id) {
    return loadDirectory(business.directory_id)
  }

  const { data: university } = await supabase
    .from('university_profiles')
    .select('directory_id, status')
    .eq('owner_user_id', userId)
    .neq('status', 'suspended')
    .maybeSingle()

  if (university?.directory_id) {
    return loadDirectory(university.directory_id)
  }

  return null
}
