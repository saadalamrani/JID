import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { isUserRole, PRIVILEGED_STAFF_ROLES, type UserRole } from '@/lib/auth/rbac'
import {
  canViewerSeeProfile,
  isPrivilegedStaffRole,
  isProfileHiddenFromNonStaff,
} from './visibility-rules'
import type {
  CompanyProfileRecord,
  CompanyPageContext,
  MentorCareerEntry,
  MentorActiveWorkshop,
  MentorPageContext,
  MentorProfileRecord,
  MentorReviewRecord,
  ProfileRecord,
  ProfileViewer,
} from './types'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(supabase: SupabaseClient<Database>): UntypedClient {
  return supabase as unknown as UntypedClient
}

/** Service-role client for page-level gate orchestration (bypasses RLS). */
async function getOrchestrationClient(): Promise<UntypedClient> {
  try {
    return asUntyped(createAdminClient())
  } catch {
    const supabase = await createClient()
    return asUntyped(supabase)
  }
}

const PROFILE_SELECT = `
  id,
  full_name,
  headline,
  about_me,
  avatar_url,
  target_sectors,
  target_program_types,
  target_regions,
  smart_links,
  profile_completion_pct,
  profile_state,
  visibility,
  show_profile_to_companies,
  show_profile_in_university_stats,
  suspended_at,
  suspended_reason,
  deleted_at,
  university_id,
  college_id,
  linkedin_url,
  locale,
  role,
  created_at,
  updated_at
` as const

function mapProfileRow(row: Record<string, unknown>): ProfileRecord | null {
  const role = row.role
  if (typeof role !== 'string' || !isUserRole(role)) return null

  return {
    id: String(row.id),
    full_name: (row.full_name as string | null) ?? null,
    headline: (row.headline as string | null) ?? null,
    about_me: (row.about_me as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    target_sectors: (row.target_sectors as string[]) ?? [],
    target_program_types: (row.target_program_types as string[]) ?? [],
    target_regions: (row.target_regions as string[]) ?? [],
    smart_links: (row.smart_links as Record<string, unknown>) ?? {},
    profile_completion_pct: Number(row.profile_completion_pct ?? 0),
    profile_state: (row.profile_state as ProfileRecord['profile_state']) ?? 'incomplete',
    visibility: (row.visibility as ProfileRecord['visibility']) ?? 'private',
    show_profile_to_companies: Boolean(row.show_profile_to_companies),
    show_profile_in_university_stats: Boolean(row.show_profile_in_university_stats),
    suspended_at: (row.suspended_at as string | null) ?? null,
    suspended_reason: (row.suspended_reason as string | null) ?? null,
    deleted_at: (row.deleted_at as string | null) ?? null,
    university_id: (row.university_id as string | null) ?? null,
    college_id: (row.college_id as string | null) ?? null,
    linkedin_url: (row.linkedin_url as string | null) ?? null,
    locale: String(row.locale ?? 'ar'),
    role,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export function stripSensitiveProfileFields(
  profile: ProfileRecord,
  viewer: ProfileViewer,
): ProfileRecord {
  return stripSensitiveFields(profile, viewer)
}

function stripSensitiveFields(profile: ProfileRecord, viewer: ProfileViewer): ProfileRecord {
  const isOwner = viewer.userId === profile.id
  const isStaff = viewer.isAdmin || isPrivilegedStaffRole(viewer.role)

  if (isOwner || isStaff) {
    return profile
  }

  const { suspended_reason: _removed, ...rest } = profile
  return rest
}

/**
 * Resolves the current session into a ProfileViewer (Section 12 Step 5).
 */
export async function getCurrentViewer(): Promise<ProfileViewer> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      userId: null,
      role: null,
      companyId: null,
      isVerified: false,
      isAdmin: false,
      isMentorApproved: false,
    }
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role: UserRole | null =
    profileRow?.role && isUserRole(profileRow.role) ? profileRow.role : null

  const isAdmin = role !== null && (PRIVILEGED_STAFF_ROLES as readonly string[]).includes(role)

  const { data: companyClaim } = await asUntyped(supabase)
    .from('verification_requests')
    .select('directory_id, verification_type')
    .eq('applicant_user_id', user.id)
    .eq('status', 'approved')
    .eq('verification_type', 'business')
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: mentorRow } = await asUntyped(supabase)
    .from('mentor_profiles')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle()

  const claimRow = companyClaim as { directory_id?: string } | null
  const companyId = claimRow?.directory_id ?? null
  const isVerified =
    role !== null &&
    (role as string) === 'company_admin' &&
    companyId !== null

  const mentorStatus = (mentorRow as { status?: string } | null)?.status

  return {
    userId: user.id,
    role,
    companyId,
    isVerified,
    isAdmin,
    isMentorApproved: mentorStatus === 'approved',
  }
}

/** Raw profile row — no visibility filtering (page orchestrates gates). */
export async function fetchProfileRawById(profileId: string): Promise<ProfileRecord | null> {
  const client = await getOrchestrationClient()
  const { data, error } = await client
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', profileId)
    .maybeSingle()

  if (error || !data) return null
  return mapProfileRow(data as Record<string, unknown>)
}

export type ProfileSkillRow = {
  id: string
  name: string
  name_ar: string | null
}

export type ProfilePageContext = {
  profile: ProfileRecord
  skillCount: number
  skills: ProfileSkillRow[]
  universityName: string | null
  collegeName: string | null
  /** First target region used as display city when present. */
  city: string | null
}

export async function fetchProfilePageContext(profileId: string): Promise<ProfilePageContext | null> {
  const profile = await fetchProfileRawById(profileId)
  if (!profile) return null

  const client = await getOrchestrationClient()

  const { data: skillRows } = await client
    .from('profile_skills')
    .select('skill_id, skills (id, name, name_ar)')
    .eq('profile_id', profileId)

  const skills: ProfileSkillRow[] = (skillRows ?? [])
    .map((row) => {
      const nested = (row as unknown as { skills?: ProfileSkillRow | null }).skills
      if (!nested?.id) return null
      return {
        id: nested.id,
        name: nested.name,
        name_ar: nested.name_ar ?? null,
      }
    })
    .filter((s): s is ProfileSkillRow => s !== null)

  let universityName: string | null = null
  let collegeName: string | null = null

  if (profile.university_id) {
    const { data: uni } = await client
      .from('universities_catalog')
      .select('name_ar, name_en')
      .eq('id', profile.university_id)
      .maybeSingle()
    if (uni) {
      const u = uni as { name_ar: string | null; name_en: string }
      universityName = u.name_ar ?? u.name_en
    }
  }

  if (profile.college_id) {
    const { data: col } = await client
      .from('colleges_catalog')
      .select('name_ar, name_en')
      .eq('id', profile.college_id)
      .maybeSingle()
    if (col) {
      const c = col as { name_ar: string | null; name_en: string }
      collegeName = c.name_ar ?? c.name_en
    }
  }

  const city = profile.target_regions[0] ?? null

  return {
    profile,
    skillCount: skills.length,
    skills,
    universityName,
    collegeName,
    city,
  }
}

/**
 * Server-side profile fetch with visibility + suspension privacy (Section 6.3 / 13).
 * Returns null when the viewer must not see the profile (including hidden suspension).
 */
export async function fetchProfile(
  profileId: string,
  options?: { viewer?: ProfileViewer },
): Promise<ProfileRecord | null> {
  const viewer = options?.viewer ?? (await getCurrentViewer())
  const supabase = await createClient()

  const { data, error } = await asUntyped(supabase)
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', profileId)
    .maybeSingle()

  if (error || !data) return null

  const profile = mapProfileRow(data as Record<string, unknown>)
  if (!profile) return null

  const isOwner = viewer.userId === profile.id
  const isStaff = viewer.isAdmin || isPrivilegedStaffRole(viewer.role)

  if (!isOwner && !isStaff && isProfileHiddenFromNonStaff(profile)) {
    return null
  }

  if (!canViewerSeeProfile(viewer, profile)) {
    return null
  }

  return stripSensitiveFields(profile, viewer)
}

export async function fetchCompany(companyId: string): Promise<CompanyProfileRecord | null> {
  const client = await getOrchestrationClient()

  const { data, error } = await client
    .from('companies')
    .select(
      `
      id,
      name,
      name_ar,
      tagline_ar,
      tagline_en,
      about_long_ar,
      about_long_en,
      founded_year,
      employee_count_range,
      office_locations,
      entity_type,
      entity_state,
      is_verified,
      is_on_honor_roll,
      last_activity_at,
      domains,
      avg_response_days,
      response_rate_pct,
      total_jobs_posted_12mo
    `,
    )
    .eq('id', companyId)
    .maybeSingle()

  if (error || !data) return null

  return mapCompanyRow(data as Record<string, unknown>)
}

function mapCompanyRow(row: Record<string, unknown>): CompanyProfileRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    name_ar: (row.name_ar as string | null) ?? null,
    tagline_ar: (row.tagline_ar as string | null) ?? null,
    tagline_en: (row.tagline_en as string | null) ?? null,
    about_long_ar: (row.about_long_ar as string | null) ?? null,
    about_long_en: (row.about_long_en as string | null) ?? null,
    founded_year: row.founded_year != null ? Number(row.founded_year) : null,
    employee_count_range: (row.employee_count_range as string | null) ?? null,
    office_locations: row.office_locations ?? [],
    entity_type: String(row.entity_type ?? 'business'),
    entity_state: String(row.entity_state ?? 'unclaimed'),
    is_verified: Boolean(row.is_verified),
    is_on_honor_roll: Boolean(row.is_on_honor_roll),
    last_activity_at: (row.last_activity_at as string | null) ?? null,
    domains: (row.domains as string[]) ?? [],
    avg_response_days: row.avg_response_days != null ? Number(row.avg_response_days) : null,
    response_rate_pct: row.response_rate_pct != null ? Number(row.response_rate_pct) : null,
    total_jobs_posted_12mo: Number(row.total_jobs_posted_12mo ?? 0),
  }
}

export async function fetchCompanyPageContext(companyId: string): Promise<CompanyPageContext | null> {
  const company = await fetchCompany(companyId)
  if (!company) return null

  return {
    company,
    /** Job Board integration — Section 12 Step 10 placeholder. */
    activeJobsCount: 0,
  }
}

export async function fetchMentor(userId: string): Promise<MentorProfileRecord | null> {
  const viewer = await getCurrentViewer()
  const mentor = await fetchMentorRawById(userId)
  if (!mentor) return null

  const isStaff = viewer.isAdmin || isPrivilegedStaffRole(viewer.role)
  if (mentor.status !== 'approved' && !isStaff) return null

  return mentor
}

const MENTOR_SELECT = `
  user_id,
  status,
  headline,
  bio_short,
  bio_long,
  avg_response_hours,
  career_history,
  rating_avg,
  sessions_count,
  expertise_sectors,
  expertise_areas,
  specializations,
  years_experience,
  active_workshop
` as const

function parseCareerHistory(raw: unknown): MentorCareerEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is MentorCareerEntry => item !== null && typeof item === 'object')
}

function parseActiveWorkshop(raw: unknown): MentorActiveWorkshop | null {
  if (!raw || typeof raw !== 'object') return null
  const w = raw as Record<string, unknown>
  if (typeof w.title !== 'string' || !w.title.trim()) return null
  return {
    title: w.title,
    title_ar: (w.title_ar as string | null) ?? null,
    scheduled_at: (w.scheduled_at as string | null) ?? null,
    spots_remaining: w.spots_remaining != null ? Number(w.spots_remaining) : null,
    url: (w.url as string | null) ?? null,
  }
}

function mapMentorRow(
  row: Record<string, unknown>,
  profile: MentorProfileRecord['profile'],
): MentorProfileRecord {
  return {
    user_id: String(row.user_id),
    status: String(row.status),
    headline: (row.headline as string | null) ?? null,
    bio_short: (row.bio_short as string | null) ?? null,
    bio_long: (row.bio_long as string | null) ?? null,
    avg_response_hours: row.avg_response_hours != null ? Number(row.avg_response_hours) : null,
    career_history: parseCareerHistory(row.career_history),
    rating_avg: row.rating_avg != null ? Number(row.rating_avg) : null,
    sessions_count: Number(row.sessions_count ?? 0),
    expertise_sectors: (row.expertise_sectors as string[]) ?? [],
    expertise_areas: (row.expertise_areas as string[]) ?? [],
    specializations: (row.specializations as string[]) ?? [],
    years_experience: row.years_experience != null ? Number(row.years_experience) : null,
    active_workshop: parseActiveWorkshop(row.active_workshop),
    profile,
  }
}

/** Raw mentor row — page orchestrates approval gate (Section 6.10). */
export async function fetchMentorRawById(userId: string): Promise<MentorProfileRecord | null> {
  const client = await getOrchestrationClient()
  const { data, error } = await client
    .from('mentor_profiles')
    .select(MENTOR_SELECT)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null

  const profile = await fetchProfileRawById(userId)
  if (!profile) return null

  return mapMentorRow(data as Record<string, unknown>, {
    id: profile.id,
    full_name: profile.full_name,
    headline: profile.headline,
    avatar_url: profile.avatar_url,
    visibility: profile.visibility,
    profile_state: profile.profile_state,
    suspended_at: profile.suspended_at,
    deleted_at: profile.deleted_at,
  })
}

export async function fetchMentorReviews(
  mentorId: string,
  limit = 3,
): Promise<MentorReviewRecord[]> {
  const client = await getOrchestrationClient()
  const { data, error } = await client
    .from('mentor_reviews')
    .select(
      'id, rating, review_text, visibility, created_at, reviewer_id, profiles:reviewer_id (full_name)',
    )
    .eq('mentor_id', mentorId)
    .in('visibility', ['public_named', 'public_anonymous'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>
    const nested = record.profiles as { full_name?: string | null } | null
    const visibility = String(record.visibility) as MentorReviewRecord['visibility']
    const reviewerName =
      visibility === 'public_named' ? (nested?.full_name ?? null) : null

    return {
      id: String(record.id),
      rating: Number(record.rating),
      review_text: (record.review_text as string | null) ?? null,
      visibility,
      created_at: String(record.created_at),
      reviewer_name: reviewerName,
    }
  })
}

export async function fetchMentorPageContext(userId: string): Promise<MentorPageContext | null> {
  const mentor = await fetchMentorRawById(userId)
  if (!mentor) return null

  const reviews = await fetchMentorReviews(userId, 3)
  return { mentor, reviews }
}

export type SkillCatalogRow = {
  id: string
  name: string
  name_ar: string | null
}

export async function fetchSkillsCatalog(): Promise<SkillCatalogRow[]> {
  const client = await getOrchestrationClient()
  const { data, error } = await client.from('skills').select('id, name, name_ar').order('name')

  if (error) return []
  return (data ?? []) as SkillCatalogRow[]
}

export async function fetchProfileSkillIds(profileId: string): Promise<string[]> {
  const client = await getOrchestrationClient()
  const { data } = await client.from('profile_skills').select('skill_id').eq('profile_id', profileId)
  return (data ?? []).map((row) => String((row as { skill_id: string }).skill_id))
}

export async function fetchOwnProfilePageContext(): Promise<ProfilePageContext | null> {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) return null
  return fetchProfilePageContext(viewer.userId)
}

export async function fetchOwnCompanyPageContext(): Promise<CompanyPageContext | null> {
  const viewer = await getCurrentViewer()
  if (!viewer.companyId) return null
  return fetchCompanyPageContext(viewer.companyId)
}

export async function fetchOwnMentorPageContext(): Promise<MentorPageContext | null> {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) return null
  return fetchMentorPageContext(viewer.userId)
}
