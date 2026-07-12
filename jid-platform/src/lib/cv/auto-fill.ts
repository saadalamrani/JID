import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CvFullRecord, CvLanguageEntry, CvLanguageProficiency } from '@/types/cv'
import { CV_LANGUAGE_PROFICIENCY_LEVELS } from '@/types/cv'
import {
  buildEducationSeed,
  buildHeaderInsert,
  type AutofillSource,
} from '@/lib/cv/autofill-payload'

export type { AutofillSource } from '@/lib/cv/autofill-payload'
export { buildAutofillPayload } from '@/lib/cv/autofill-payload'

type CvRow = Database['public']['Tables']['cvs']['Row']
type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

function parseTechnicalSkills(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseLanguageJson(value: unknown): CvLanguageEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const name = 'name' in entry && typeof entry.name === 'string' ? entry.name.trim() : ''
      const proficiency =
        'proficiency' in entry &&
        typeof entry.proficiency === 'string' &&
        (CV_LANGUAGE_PROFICIENCY_LEVELS as readonly string[]).includes(entry.proficiency)
          ? (entry.proficiency as CvLanguageProficiency)
          : null
      if (!name || !proficiency) return null
      return { name, proficiency }
    })
    .filter((entry): entry is CvLanguageEntry => entry != null)
}

const AUTOFILL_PROFILE_SELECT = `
  id,
  full_name,
  phone,
  about_me,
  target_regions,
  university_id,
  college_id,
  linkedin_url,
  locale
` as const

export type InitializeCvResult = {
  cv: CvFullRecord
  created: boolean
}

/** Section 8 — resolve email from user_verified_emails (primary) then auth session. */
async function resolveAutofillEmail(
  userId: string,
  authEmail: string | undefined,
): Promise<string | null> {
  const supabase = await createClient()

  const { data: primary } = await supabase
    .from('user_verified_emails')
    .select('email')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .maybeSingle()

  if (primary?.email) return primary.email

  const { data: anyVerified } = await supabase
    .from('user_verified_emails')
    .select('email')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (anyVerified?.email) return anyVerified.email

  return authEmail?.trim() || null
}

async function loadAutofillSource(userId: string, authEmail?: string): Promise<AutofillSource | null> {
  const supabase = asUntyped(await createClient())

  const { data: profileRow, error } = await supabase
    .from('profiles')
    .select(AUTOFILL_PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle()

  if (error || !profileRow) return null

  const profile = profileRow as {
    id: string
    full_name: string | null
    phone: string | null
    about_me: string | null
    target_regions: string[]
    university_id: string | null
    college_id: string | null
    linkedin_url: string | null
    locale: string
  }

  const profileLocale = profile.locale ?? 'ar'

  let universityName: string | null = null
  let collegeName: string | null = null

  if (profile.university_id) {
    const { data: uni } = await supabase
      .from('universities')
      .select('name, name_ar')
      .eq('id', profile.university_id)
      .maybeSingle()
    if (uni) {
      const row = uni as { name: string; name_ar: string | null }
      universityName = row.name_ar ?? row.name
    }
  }

  if (profile.college_id) {
    const { data: col } = await supabase
      .from('colleges')
      .select('name, name_ar')
      .eq('id', profile.college_id)
      .maybeSingle()
    if (col) {
      const row = col as { name: string; name_ar: string | null }
      collegeName = row.name_ar ?? row.name
    }
  }

  const email = await resolveAutofillEmail(userId, authEmail)

  return {
    full_name: profile.full_name,
    phone: profile.phone,
    linkedin_url: profile.linkedin_url,
    university_id: profile.university_id,
    college_id: profile.college_id,
    target_regions: profile.target_regions ?? [],
    email,
    universityName,
    collegeName,
    about_me: profile.about_me,
    profileLocale,
  }
}

function mapCvRow(row: CvRow): CvFullRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    status: row.status,
    locale: row.locale,
    is_primary: row.is_primary,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    country: row.country,
    linkedin_url: row.linkedin_url,
    github_url: row.github_url ?? null,
    portfolio_url: row.portfolio_url ?? null,
    custom_link_1_label: row.custom_link_1_label ?? null,
    custom_link_1_url: row.custom_link_1_url ?? null,
    custom_link_2_label: row.custom_link_2_label ?? null,
    custom_link_2_url: row.custom_link_2_url ?? null,
    summary: row.summary,
    template_key: row.template_key,
    technical_skills: parseTechnicalSkills(row.technical_skills),
    languages: parseLanguageJson(row.languages),
    created_at: row.created_at,
    updated_at: row.updated_at,
    education: [],
    experience: [],
    skills: [],
    additional: [],
  }
}

async function loadCvWithChildren(cvId: string): Promise<CvFullRecord | null> {
  const supabase = await createClient()

  const { data: cvRow, error } = await supabase.from('cvs').select('*').eq('id', cvId).maybeSingle()
  if (error || !cvRow) return null

  const [education, experience, skills, additional] = await Promise.all([
    supabase
      .from('cv_education')
      .select('*')
      .eq('cv_id', cvId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('cv_experience')
      .select('*')
      .eq('cv_id', cvId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('cv_skills')
      .select('*')
      .eq('cv_id', cvId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('cv_additional')
      .select('*')
      .eq('cv_id', cvId)
      .order('sort_order', { ascending: true }),
  ])

  return {
    ...mapCvRow(cvRow as CvRow),
    education: (education.data ?? []) as CvFullRecord['education'],
    experience: (experience.data ?? []) as CvFullRecord['experience'],
    skills: (skills.data ?? []) as CvFullRecord['skills'],
    additional: (additional.data ?? []) as CvFullRecord['additional'],
  }
}

async function findExistingCvId(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: primary } = await supabase
    .from('cvs')
    .select('id')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (primary?.id) return primary.id

  const { data: latest } = await supabase
    .from('cvs')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return latest?.id ?? null
}

/**
 * Section 8 — on first visit, reuse existing `cvs` row or auto-create with profile autofill.
 * Reconciled Day 1: university_id/college_id joins, email from session/verified emails, no profiles.email.
 */
export async function initializeCv(): Promise<InitializeCvResult | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const existingId = await findExistingCvId(user.id)
  if (existingId) {
    const cv = await loadCvWithChildren(existingId)
    if (!cv) return null
    return { cv, created: false }
  }

  const source = await loadAutofillSource(user.id, user.email)
  if (!source) return null

  const headerInsert = buildHeaderInsert(user.id, source, source.profileLocale)

  const { data: inserted, error: insertError } = await supabase
    .from('cvs')
    .insert(headerInsert)
    .select('*')
    .single()

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? 'Failed to create CV')
  }

  const educationSeed = buildEducationSeed(source)
  if (educationSeed) {
    const { error: eduError } = await supabase.from('cv_education').insert({
      cv_id: inserted.id,
      ...educationSeed,
    })
    if (eduError) {
      throw new Error(eduError.message)
    }
  }

  const cv = await loadCvWithChildren(inserted.id)
  if (!cv) return null

  return { cv, created: true }
}

export async function fetchCvById(cvId: string): Promise<CvFullRecord | null> {
  return loadCvWithChildren(cvId)
}

/** Primary CV document for profile projections (owner + permitted public sections). */
export async function fetchPrimaryCvForUser(userId: string): Promise<CvFullRecord | null> {
  const cvId = await findExistingCvId(userId)
  if (!cvId) return null
  return loadCvWithChildren(cvId)
}
