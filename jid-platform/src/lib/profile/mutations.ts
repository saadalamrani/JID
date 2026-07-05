import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import type {
  CompanyProfileEditValues,
  IndividualPrivacyValues,
  IndividualProfileEditValues,
  MentorProfileEditValues,
} from '@/lib/validations/profile'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(supabase: SupabaseClient<Database>): UntypedClient {
  return supabase as unknown as UntypedClient
}

function emptyToNull(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

async function requireUserId(supabase: SupabaseClient<Database>): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
}

async function syncProfileSkills(
  client: UntypedClient,
  profileId: string,
  skillIds: string[],
): Promise<void> {
  const { error: deleteError } = await client
    .from('profile_skills')
    .delete()
    .eq('profile_id', profileId)

  if (deleteError) throw new Error(deleteError.message)

  if (skillIds.length === 0) return

  const { error: insertError } = await client.from('profile_skills').insert(
    skillIds.map((skill_id) => ({ profile_id: profileId, skill_id })),
  )

  if (insertError) throw new Error(insertError.message)
}

export async function updateIndividualProfile(
  values: IndividualProfileEditValues,
): Promise<void> {
  const supabase = createClient()
  const userId = await requireUserId(supabase)
  const client = asUntyped(supabase)

  const smartLinks = {
    ...(values.smart_links.linkedin ? { linkedin: values.smart_links.linkedin } : {}),
    ...(values.smart_links.github ? { github: values.smart_links.github } : {}),
    ...(values.smart_links.portfolio ? { portfolio: values.smart_links.portfolio } : {}),
    ...(values.smart_links.custom ? { custom: values.smart_links.custom } : {}),
  }

  const { error } = await client
    .from('profiles')
    .update({
      avatar_url: emptyToNull(values.avatar_url),
      headline: emptyToNull(values.headline),
      about_me: emptyToNull(values.about_me),
      target_sectors: values.target_sectors,
      target_program_types: values.target_program_types,
      target_regions: values.target_regions,
      linkedin_url: emptyToNull(values.linkedin_url),
      smart_links: smartLinks,
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  await syncProfileSkills(client, userId, values.skill_ids)
}

export async function updateIndividualPrivacy(values: IndividualPrivacyValues): Promise<void> {
  const supabase = createClient()
  const userId = await requireUserId(supabase)
  const client = asUntyped(supabase)

  const { error } = await client
    .from('profiles')
    .update({
      visibility: values.visibility,
      show_profile_to_companies: values.show_profile_to_companies,
      show_profile_in_university_stats: values.show_profile_in_university_stats,
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}

export async function updateCompanyProfile(
  companyId: string,
  values: CompanyProfileEditValues,
): Promise<void> {
  const supabase = createClient()
  await requireUserId(supabase)
  const client = asUntyped(supabase)

  const { error } = await client
    .from('companies')
    .update({
      tagline_ar: emptyToNull(values.tagline_ar),
      tagline_en: emptyToNull(values.tagline_en),
      about_long_ar: emptyToNull(values.about_long_ar),
      about_long_en: emptyToNull(values.about_long_en),
      founded_year: values.founded_year ?? null,
      employee_count_range: emptyToNull(values.employee_count_range),
      office_locations: values.office_locations,
    })
    .eq('id', companyId)

  if (error) throw new Error(error.message)
}

export async function updateMentorProfile(
  values: MentorProfileEditValues,
): Promise<void> {
  const supabase = createClient()
  const userId = await requireUserId(supabase)
  const client = asUntyped(supabase)

  const { error } = await client
    .from('mentor_profiles')
    .update({
      bio_long: emptyToNull(values.bio_long),
      career_history: values.career_history,
      expertise_sectors: values.expertise_sectors,
    })
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function uploadProfileAvatar(file: File): Promise<string> {
  const supabase = createClient()
  const userId = await requireUserId(supabase)
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export async function reinstateProfile(profileId: string): Promise<void> {
  const supabase = createClient()
  await requireUserId(supabase)

  const { error } = await (supabase as unknown as {
    rpc: (fn: string, args: { p_target_user_id: string }) => Promise<{ error: { message: string } | null }>
  }).rpc('reinstate_profile', { p_target_user_id: profileId })

  if (error) throw new Error(error.message)
}
