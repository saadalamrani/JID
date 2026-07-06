/**
 * Pure autofill payload builder — testable without server-only imports.
 * Mirrors Section 8 mapping in auto-fill.ts.
 */

import type { Database } from '@/lib/supabase/types'
import type { ProfileCvAutofillSource } from '@/types/cv'

export type AutofillSource = ProfileCvAutofillSource & {
  email: string | null
  universityName: string | null
  collegeName: string | null
  about_me: string | null
  profileLocale: string
}

export function buildEducationSeed(source: AutofillSource): Omit<
  Database['public']['Tables']['cv_education']['Insert'],
  'cv_id'
> | null {
  if (!source.universityName && !source.collegeName) return null

  return {
    institution_name: source.universityName ?? source.collegeName!,
    field_of_study: source.universityName && source.collegeName ? source.collegeName : null,
    degree: null,
    graduation_year: null,
    gpa_value: null,
    gpa_scale: null,
    start_month: null,
    start_year: null,
    end_month: null,
    end_year: null,
    is_current: true,
    sort_order: 0,
  }
}

export function buildHeaderInsert(
  userId: string,
  source: AutofillSource,
  profileLocale: string,
): Database['public']['Tables']['cvs']['Insert'] {
  const cvLocale = profileLocale === 'en' ? 'en' : 'ar'

  return {
    user_id: userId,
    title: cvLocale === 'ar' ? 'سيرتي الذاتية' : 'My CV',
    status: 'draft',
    locale: cvLocale,
    is_primary: true,
    full_name: source.full_name,
    email: source.email,
    phone: source.phone,
    city: source.target_regions[0] ?? null,
    country: null,
    linkedin_url: source.linkedin_url,
    summary: source.about_me,
    template_key: 'classic',
  }
}

export function buildAutofillPayload(
  source: AutofillSource,
  profileLocale = 'ar',
): {
  header: Database['public']['Tables']['cvs']['Insert']
  education: ReturnType<typeof buildEducationSeed>
} {
  return {
    header: buildHeaderInsert('00000000-0000-0000-0000-000000000000', source, profileLocale),
    education: buildEducationSeed(source),
  }
}
