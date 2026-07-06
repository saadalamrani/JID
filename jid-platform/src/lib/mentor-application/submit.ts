import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { generateMentorSlug } from '@/lib/mentor-application/slug'
import type { BecomeMentorInput } from '@/lib/validations/become-mentor'

export type SubmitMentorApplicationResult = {
  user_id: string
  slug: string
  status: 'pending_review'
}

const BLOCKED_REAPPLY_STATUSES = new Set([
  'pending_review',
  'pending',
  'under_review',
  'approved',
  'suspended',
])

function buildCareerHistory(input: BecomeMentorInput) {
  return [
    {
      title: input.current_job_title,
      company: input.current_company,
      end_year: null,
    },
  ]
}

function assertExpertiseLimit(expertiseAreas: string[]) {
  if (expertiseAreas.length > 5) {
    throw new Error('الحد الأقصى 5 مجالات خبرة')
  }
}

/**
 * Section 4.2 — INSERT (or re-apply UPDATE from rejected) into mentor_profiles via RLS.
 */
export async function submitMentorApplication(
  userId: string,
  input: BecomeMentorInput,
): Promise<SubmitMentorApplicationResult> {
  assertExpertiseLimit(input.expertise_areas)

  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle()

  if (profileError || !profile?.full_name?.trim()) {
    throw new Error('أكمل ملفك الشخصي قبل التقديم كمرشد')
  }

  const fullName = profile.full_name.trim()
  const slug = generateMentorSlug(fullName)
  const now = new Date().toISOString()

  const payload = {
    headline: input.headline,
    years_experience: input.years_experience,
    bio_long: input.bio_long,
    bio_short: input.bio_long.slice(0, 160),
    career_history: buildCareerHistory(input),
    expertise_areas: input.expertise_areas,
    expertise_sectors: input.expertise_areas,
    languages: input.languages,
    preferred_mediums: input.preferred_mediums,
    linkedin_url: input.linkedin_url,
    slug,
    status: 'pending_review' as const,
    application_submitted_at: now,
    is_accepting_requests: false,
  }

  const { data: existing, error: existingError } = await supabase
    .from('mentor_profiles')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message)
  }

  if (!existing) {
    const { error: insertError } = await supabase.from('mentor_profiles').insert({
      user_id: userId,
      ...payload,
    })

    if (insertError) {
      throw new Error(insertError.message)
    }

    return { user_id: userId, slug, status: 'pending_review' }
  }

  if (BLOCKED_REAPPLY_STATUSES.has(existing.status)) {
    throw new Error('لديك طلب مرشد قائم بالفعل')
  }

  if (existing.status !== 'rejected') {
    throw new Error('تعذّر تقديم الطلب')
  }

  const { error: updateError } = await supabase
    .from('mentor_profiles')
    .update({
      ...payload,
      rejection_reason: null,
      reviewed_at: null,
      reviewed_by: null,
    })
    .eq('user_id', userId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  return { user_id: userId, slug, status: 'pending_review' }
}
