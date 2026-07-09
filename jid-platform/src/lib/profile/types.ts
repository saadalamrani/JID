import type { UserRole } from '@/lib/auth/rbac'

export type ProfileVisibility = 'private' | 'discoverable' | 'public'

export type ProfileState = 'incomplete' | 'active' | 'suspended' | 'deleted'

/** Minimal profile fields required for visibility decisions (Section 6.3 / 12 Step 5). */
export type ProfileVisibilityInput = {
  id: string
  visibility: ProfileVisibility
  show_profile_to_companies: boolean
  suspended_at: string | null
  deleted_at: string | null
  profile_state?: ProfileState
}

/** Session-derived viewer context for visibility checks. */
export type ProfileViewer = {
  userId: string | null
  role: UserRole | null
  /** Approved company claim id (HR viewer). Never used to compare commitment scores. */
  companyId: string | null
  /** True when the viewer has an approved company ownership claim. */
  isVerified: boolean
  /** Privileged staff (staff / admin / super_admin). */
  isAdmin: boolean
  /** Approved mentor_profiles.status = 'approved' (individual mentors only). */
  isMentorApproved: boolean
}

export type ProfileRecord = ProfileVisibilityInput & {
  full_name: string | null
  headline: string | null
  about_me: string | null
  avatar_url: string | null
  target_sectors: string[]
  target_program_types: string[]
  target_regions: string[]
  smart_links: Record<string, unknown>
  profile_completion_pct: number
  profile_state: ProfileState
  show_profile_in_university_stats: boolean
  university_id: string | null
  college_id: string | null
  linkedin_url: string | null
  locale: string
  role: UserRole
  created_at: string
  updated_at: string
  suspended_reason?: string | null
}

export type CompanyProfileRecord = {
  id: string
  name: string
  name_ar: string | null
  tagline_ar: string | null
  tagline_en: string | null
  about_long_ar: string | null
  about_long_en: string | null
  founded_year: number | null
  employee_count_range: string | null
  office_locations: unknown
  entity_type: string
  entity_state: string
  is_verified: boolean
  is_on_honor_roll: boolean
  last_activity_at: string | null
  domains: string[]
  avg_response_days: number | null
  response_rate_pct: number | null
  total_jobs_posted_12mo: number
}

export type CompanyPageContext = {
  company: CompanyProfileRecord
  /** Placeholder until Job Board module ships. */
  activeJobsCount: number
}

export type MentorCareerEntry = {
  title?: string
  company?: string
  start_year?: number
  end_year?: number | null
  description?: string
}

export type MentorActiveWorkshop = {
  title: string
  title_ar?: string | null
  scheduled_at?: string | null
  workshop_date?: string | null
  is_active?: boolean
  spots_remaining?: number | null
  url?: string | null
}

export type MentorReviewRecord = {
  id: string
  rating: number
  body: string | null
  created_at: string
  reviewer_name: string | null
}

export type MentorProfileRecord = {
  user_id: string
  status: string
  headline: string | null
  bio_short: string | null
  bio_long: string | null
  avg_response_hours: number | null
  career_history: MentorCareerEntry[]
  rating_avg: number | null
  sessions_count: number
  expertise_sectors: string[]
  years_experience: number | null
  active_workshop: MentorActiveWorkshop | null
  profile: Pick<
    ProfileRecord,
    | 'id'
    | 'full_name'
    | 'headline'
    | 'avatar_url'
    | 'visibility'
    | 'profile_state'
    | 'suspended_at'
    | 'deleted_at'
  >
}

export type MentorPageContext = {
  mentor: MentorProfileRecord
  reviews: MentorReviewRecord[]
}

export type BadgeCatalogMeta = {
  id: string
  slug: string
  category: string
  name_ar: string
  name_en: string
  description_ar: string | null
  description_en: string | null
  icon_key: string | null
}

export type EarnedUserBadge = BadgeCatalogMeta & {
  awarded_at: string
  metadata: Record<string, unknown>
}

export type EarnedEntityBadge = BadgeCatalogMeta & {
  awarded_at: string
  expires_at: string | null
  metadata: Record<string, unknown>
}
