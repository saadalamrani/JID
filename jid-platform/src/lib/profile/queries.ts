import 'server-only'

import { createClient } from '@/lib/supabase/server'
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
  MentorProfileRecord,
  ProfileRecord,
  ProfileViewer,
} from './types'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(supabase: SupabaseClient<Database>): UntypedClient {
  return supabase as unknown as UntypedClient
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
    .from('claim_requests')
    .select('company_id, claim_type')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .eq('claim_type', 'company')
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: mentorRow } = await asUntyped(supabase)
    .from('mentor_profiles')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle()

  const claimRow = companyClaim as { company_id?: string } | null
  const companyId = claimRow?.company_id ?? null
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
  const supabase = await createClient()
  const { data, error } = await asUntyped(supabase)
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

  const supabase = await createClient()
  const client = asUntyped(supabase)

  const { data: skillRows } = await client
    .from('profile_skills')
    .select('skill_id, skills (id, name, name_ar)')
    .eq('profile_id', profileId)

  const skills: ProfileSkillRow[] = (skillRows ?? [])
    .map((row) => {
      const nested = (row as { skills?: ProfileSkillRow | null }).skills
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
      .from('universities')
      .select('name, name_ar')
      .eq('id', profile.university_id)
      .maybeSingle()
    if (uni) {
      const u = uni as { name: string; name_ar: string | null }
      universityName = u.name_ar ?? u.name
    }
  }

  if (profile.college_id) {
    const { data: col } = await client
      .from('colleges')
      .select('name, name_ar')
      .eq('id', profile.college_id)
      .maybeSingle()
    if (col) {
      const c = col as { name: string; name_ar: string | null }
      collegeName = c.name_ar ?? c.name
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
  const supabase = await createClient()

  const { data, error } = await asUntyped(supabase)
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
      domains
    `,
    )
    .eq('id', companyId)
    .maybeSingle()

  if (error || !data) return null

  const row = data as Record<string, unknown>
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
    entity_type: String(row.entity_type ?? 'company'),
    entity_state: String(row.entity_state ?? 'unclaimed'),
    is_verified: Boolean(row.is_verified),
    is_on_honor_roll: Boolean(row.is_on_honor_roll),
    last_activity_at: (row.last_activity_at as string | null) ?? null,
    domains: (row.domains as string[]) ?? [],
  }
}

export async function fetchMentor(userId: string): Promise<MentorProfileRecord | null> {
  const viewer = await getCurrentViewer()
  const supabase = await createClient()

  const { data: mentorRow, error: mentorError } = await asUntyped(supabase)
    .from('mentor_profiles')
    .select('user_id, status, headline, bio_short, bio_long, avg_response_hours, career_history')
    .eq('user_id', userId)
    .maybeSingle()

  if (mentorError || !mentorRow) return null

  const profile = await fetchProfile(userId, { viewer })
  if (!profile) return null

  const row = mentorRow as Record<string, unknown>
  return {
    user_id: String(row.user_id),
    status: String(row.status),
    headline: (row.headline as string | null) ?? null,
    bio_short: (row.bio_short as string | null) ?? null,
    bio_long: (row.bio_long as string | null) ?? null,
    avg_response_hours: row.avg_response_hours != null ? Number(row.avg_response_hours) : null,
    career_history: row.career_history ?? [],
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      headline: profile.headline,
      avatar_url: profile.avatar_url,
      visibility: profile.visibility,
      profile_state: profile.profile_state,
      suspended_at: profile.suspended_at,
      deleted_at: profile.deleted_at,
    },
  }
}
