import 'server-only'

import { createClient } from '@/lib/supabase/server'
import {
  mentorHubSettingsSchema,
  type MentorHubSettingsInput,
} from '@/lib/validations/mentor-hub'

export class MentorSettingsError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'MentorSettingsError'
    this.status = status
  }
}

export async function updateMentorHubSettings(mentorId: string, input: MentorHubSettingsInput) {
  const parsed = mentorHubSettingsSchema.parse(input)
  const supabase = await createClient()

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (parsed.is_accepting_requests !== undefined) {
    patch.is_accepting_requests = parsed.is_accepting_requests
  }
  if (parsed.bio_long !== undefined) {
    patch.bio_long = parsed.bio_long
  }
  if (parsed.expertise_areas !== undefined) {
    patch.expertise_areas = parsed.expertise_areas
  }
  if (parsed.preferred_mediums !== undefined) {
    patch.preferred_mediums = parsed.preferred_mediums
  }

  const { data, error } = await supabase
    .from('mentor_profiles')
    .update(patch)
    .eq('user_id', mentorId)
    .eq('status', 'approved')
    .select('is_accepting_requests, bio_long, expertise_areas, preferred_mediums')
    .maybeSingle()

  if (error) throw new MentorSettingsError(error.message, 500)
  if (!data) throw new MentorSettingsError('ملف المرشد غير موجود', 404)

  return data
}
