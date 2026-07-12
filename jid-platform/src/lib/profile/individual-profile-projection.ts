import 'server-only'

import { fetchPrimaryCvForUser } from '@/lib/cv/auto-fill'
import {
  buildApplicationTimelineEntries,
  buildEducationTimelineEntries,
  buildExperienceTimelineEntries,
  buildMentorshipTimelineEntries,
  mergeTimelineEntries,
} from '@/lib/profile/career-timeline'
import { buildCompletionBreakdown } from '@/lib/profile/completion-breakdown'
import {
  buildMentorshipSummary,
  buildOwnerStats,
  buildPortfolioPreview,
  buildSkillDisplays,
  linkBadgesToTimeline,
  mapProjectsWithSkills,
} from '@/lib/profile/individual-profile-data'
import {
  resolvePermittedFields,
  stripOwnerOnlyProjectionFields,
  type PermittedProfileFields,
} from '@/lib/profile/individual-privacy-projection'
import type {
  IndividualProfileIdentity,
  IndividualProfileProjection,
  SectionVisibility,
} from '@/lib/profile/individual-projection-types'
import { fetchUserBadges } from '@/lib/profile/badge-helpers'
import {
  fetchProfilePageContext,
  getCurrentViewer,
  type ProfilePageContext,
} from '@/lib/profile/queries'
import { fetchUserApplications } from '@/lib/queries/radar'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import {
  canViewerSeeProfile,
  isPrivilegedStaffRole,
} from '@/lib/profile/visibility-rules'
import type { ProfileRecord, ProfileViewer } from '@/lib/profile/types'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

async function getOrchestrationClient(): Promise<UntypedClient> {
  try {
    return asUntyped(createAdminClient())
  } catch {
    return asUntyped(await createClient())
  }
}

type ExtendedProfileRow = ProfileRecord & {
  major_id: string | null
  graduation_year: number | null
  student_status: string | null
  allow_company_direct_contact: boolean
  phone: string | null
}

const EXTENDED_PROFILE_SELECT = `
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
  allow_company_direct_contact,
  suspended_at,
  suspended_reason,
  deleted_at,
  university_id,
  college_id,
  major_id,
  graduation_year,
  student_status,
  linkedin_url,
  locale,
  role,
  phone,
  created_at,
  updated_at
` as const

async function fetchExtendedProfile(profileId: string): Promise<ExtendedProfileRow | null> {
  const context = await fetchProfilePageContext(profileId)
  if (!context) return null

  const client = await getOrchestrationClient()
  const { data, error } = await client
    .from('profiles')
    .select(EXTENDED_PROFILE_SELECT)
    .eq('id', profileId)
    .maybeSingle()

  if (error || !data) return null

  const row = data as Record<string, unknown>

  return {
    ...context.profile,
    major_id: (row.major_id as string | null) ?? null,
    graduation_year: row.graduation_year != null ? Number(row.graduation_year) : null,
    student_status: (row.student_status as string | null) ?? null,
    allow_company_direct_contact: Boolean(row.allow_company_direct_contact),
    phone: (row.phone as string | null) ?? null,
  }
}

async function resolveMajorName(majorId: string | null): Promise<string | null> {
  if (!majorId) return null
  const client = await getOrchestrationClient()
  const { data } = await client
    .from('majors_catalog')
    .select('name, name_ar')
    .eq('id', majorId)
    .maybeSingle()
  if (!data) return null
  const row = data as { name: string; name_ar: string | null }
  return row.name_ar ?? row.name
}

function resolvePrimaryEducation(cv: Awaited<ReturnType<typeof fetchPrimaryCvForUser>>) {
  const primary = cv?.education?.[0] ?? null
  return {
    institution: primary?.institution_name ?? null,
    field: primary?.field_of_study ?? null,
    graduationYear: primary?.graduation_year ?? primary?.end_year ?? null,
  }
}

function resolvePortfolioUrl(
  extended: ExtendedProfileRow,
  cv: Awaited<ReturnType<typeof fetchPrimaryCvForUser>>,
): string | null {
  if (cv?.portfolio_url?.trim()) return cv.portfolio_url.trim()
  const fromLinks = extended.smart_links?.portfolio
  return typeof fromLinks === 'string' && fromLinks.trim() ? fromLinks.trim() : null
}

function buildIdentity(
  context: ProfilePageContext,
  extended: ExtendedProfileRow,
  fieldLabel: string | null,
  showGraduateBadge: boolean,
  cv: Awaited<ReturnType<typeof fetchPrimaryCvForUser>>,
): IndividualProfileIdentity {
  const { profile, universityName, collegeName, city } = context
  const edu = resolvePrimaryEducation(cv)
  return {
    fullName: profile.full_name,
    headline: profile.headline,
    avatarUrl: profile.avatar_url,
    city,
    fieldLabel: fieldLabel ?? edu.field ?? profile.headline,
    universityName: edu.institution ?? universityName,
    collegeName,
    graduationYear: edu.graduationYear ?? extended.graduation_year,
    employmentStatus: extended.student_status,
    showGraduateBadge,
  }
}

function buildCanvasSummary(profile: ProfileRecord): IndividualProfileProjection['canvas'] {
  const aspiration =
    profile.target_program_types?.[0] ?? profile.target_sectors?.[0] ?? null
  return {
    available: false,
    direction: profile.headline,
    aspiration,
    highlights: profile.target_sectors.slice(0, 3),
  }
}

function toSectionVisibility(permitted: PermittedProfileFields): SectionVisibility {
  return {
    showOverview: permitted.showOverview,
    showCanvas: permitted.showCanvas,
    showTimeline: permitted.showTimeline,
    showProjects: permitted.showProjects,
    showExperience: permitted.showExperience,
    showEducation: permitted.showEducation,
    showSkills: permitted.showSkills,
    showCertifications: permitted.showCertifications,
    showMentorship: permitted.showMentorship,
    showAchievements: permitted.showAchievements,
    showPortfolio: permitted.showPortfolio,
    showCvBuilder: permitted.showCvBuilder,
    showOwnerStats: permitted.showOwnerStats,
  }
}

async function loadMentorshipRows(userId: string, includeNames: boolean) {
  const client = await getOrchestrationClient()
  const { data } = await client
    .from('mentorship_meetings')
    .select('id, scheduled_at, status, mentor_id')
    .eq('mentee_id', userId)
    .order('scheduled_at', { ascending: false })
    .limit(12)

  const rows = (data ?? []) as Array<{
    id: string
    scheduled_at: string | null
    status: string
    mentor_id: string
  }>

  if (rows.length === 0) return []

  const nameById = new Map<string, string | null>()
  if (includeNames) {
    const mentorIds = Array.from(new Set(rows.map((r) => r.mentor_id)))
    const { data: mentors } = await client
      .from('mentor_profiles')
      .select('user_id, profile:profiles(full_name)')
      .in('user_id', mentorIds)

    for (const m of mentors ?? []) {
      const row = m as {
        user_id: string
        profile?: { full_name: string | null } | { full_name: string | null }[]
      }
      const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile
      nameById.set(row.user_id, profile?.full_name ?? null)
    }
  }

  return rows.map((row) => ({
    id: row.id,
    scheduled_at: row.scheduled_at,
    status: row.status,
    mentor_name: includeNames ? nameById.get(row.mentor_id) ?? null : null,
  }))
}

async function loadMentorshipRequests(userId: string) {
  const client = await getOrchestrationClient()
  const { data } = await client
    .from('mentorship_requests')
    .select('id, focus_area, intent_statement, status')
    .eq('mentee_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  return (data ?? []) as Array<{
    id: string
    focus_area: string | null
    intent_statement: string | null
    status: string
  }>
}

async function buildTimeline(
  userId: string,
  cv: Awaited<ReturnType<typeof fetchPrimaryCvForUser>>,
  badges: Awaited<ReturnType<typeof fetchUserBadges>>,
  permitted: PermittedProfileFields,
) {
  const base = [
    ...buildEducationTimelineEntries(cv?.education ?? []),
    ...buildExperienceTimelineEntries(cv?.experience ?? []),
  ]

  const extra: ReturnType<typeof mergeTimelineEntries> = []

  if (permitted.showApplicationTimeline) {
    const applicationsResult = await fetchUserApplications(userId).catch(() => ({
      applications: [],
      count: 0,
    }))
    extra.push(...buildApplicationTimelineEntries(applicationsResult.applications))
  }

  if (permitted.showMentorIdentifyingInfo) {
    const mentorshipRows = await loadMentorshipRows(userId, true)
    extra.push(...buildMentorshipTimelineEntries(mentorshipRows))
  }

  const merged = mergeTimelineEntries([...base, ...extra])
  const existingIds = new Set(merged.map((e) => e.id))
  const awardEntries = linkBadgesToTimeline(badges, existingIds)

  return {
    timeline: mergeTimelineEntries([...merged, ...awardEntries]),
    kinds: [
      'education',
      'experience',
      ...(permitted.showApplicationTimeline ? (['application'] as const) : []),
      ...(permitted.showMentorIdentifyingInfo ? (['mentorship'] as const) : []),
      'profile_milestone',
    ] as IndividualProfileProjection['timelineKinds'],
  }
}

function emptyRestrictedSections(): SectionVisibility {
  return {
    showOverview: false,
    showCanvas: false,
    showTimeline: false,
    showProjects: false,
    showExperience: false,
    showEducation: false,
    showSkills: false,
    showCertifications: false,
    showMentorship: false,
    showAchievements: false,
    showPortfolio: false,
    showCvBuilder: false,
    showOwnerStats: false,
  }
}

async function buildOwnerProjection(
  context: ProfilePageContext,
  extended: ExtendedProfileRow,
  fieldLabel: string | null,
  viewer: ProfileViewer,
): Promise<IndividualProfileProjection> {
  const permitted = resolvePermittedFields(extended, viewer)
  const [cv, badges, mentorshipRequests, mentorshipMeetings, applicationsResult] =
    await Promise.all([
      fetchPrimaryCvForUser(extended.id),
      fetchUserBadges(await getOrchestrationClient(), extended.id),
      loadMentorshipRequests(extended.id),
      loadMentorshipRows(extended.id, true),
      fetchUserApplications(extended.id).catch(() => ({ applications: [], count: 0 })),
    ])

  const portfolioUrl = resolvePortfolioUrl(extended, cv)
  const projects = mapProjectsWithSkills(cv?.additional ?? [], cv?.skills ?? [])
  const certifications = (cv?.additional ?? []).filter((row) => row.category === 'certification')
  const { timeline, kinds } = await buildTimeline(extended.id, cv, badges, permitted)
  const skills = buildSkillDisplays(
    context.skills,
    cv?.skills ?? [],
    cv?.experience ?? [],
    projects,
  )

  const breakdown = buildCompletionBreakdown({
    avatar_url: extended.avatar_url,
    headline: extended.headline,
    about_me: extended.about_me,
    university_id: extended.university_id,
    college_id: extended.college_id,
    skill_count: context.skillCount,
    target_sectors: extended.target_sectors,
    linkedin_url: extended.linkedin_url,
    smart_links: extended.smart_links,
  })

  const goals = [
    ...extended.target_program_types,
    ...extended.target_sectors.slice(0, 2),
  ].filter(Boolean)

  return {
    viewState: 'owner',
    profileId: extended.id,
    identity: buildIdentity(
      context,
      extended,
      fieldLabel,
      permitted.showGraduateBadge,
      cv,
    ),
    portfolioUrl,
    portfolio: buildPortfolioPreview(portfolioUrl, projects, extended.about_me),
    overview: extended.about_me,
    sections: toSectionVisibility(permitted),
    skills,
    education: cv?.education ?? [],
    experience: cv?.experience ?? [],
    certifications,
    projects,
    timeline,
    timelineKinds: kinds,
    canvas: buildCanvasSummary(extended),
    badges,
    mentorship: buildMentorshipSummary(mentorshipRequests, mentorshipMeetings, goals, true),
    evidenceVaultAvailable: false,
    completionPct: extended.profile_completion_pct,
    completionMissing: breakdown.missing,
    graduateBadgeVisibleInDirectory: extended.show_profile_in_university_stats,
    privacySettings: {
      visibility: extended.visibility === 'private' ? 'private' : 'discoverable',
      show_profile_to_companies: extended.show_profile_to_companies,
      show_profile_in_university_stats: extended.show_profile_in_university_stats,
    },
    allowContact: false,
    showSaveAction: false,
    publicPreviewHref: `/profile/${extended.id}?view=public`,
    ownerStats: buildOwnerStats(
      applicationsResult.applications,
      extended.profile_completion_pct,
      projects.length,
      false,
      0,
    ),
  }
}

async function buildPublicProjection(
  context: ProfilePageContext,
  extended: ExtendedProfileRow,
  fieldLabel: string | null,
  viewer: ProfileViewer,
  forcePublicPreview = false,
): Promise<IndividualProfileProjection> {
  const permitted = resolvePermittedFields(extended, viewer, { forcePublicPreview })
  const [cv, badges] = await Promise.all([
    fetchPrimaryCvForUser(extended.id),
    fetchUserBadges(await getOrchestrationClient(), extended.id),
  ])

  const filteredBadges = permitted.showGraduateBadge
    ? badges
    : badges.filter((b) => b.slug !== 'mentorship_graduate')

  const portfolioUrl = resolvePortfolioUrl(extended, cv)
  const projects = mapProjectsWithSkills(cv?.additional ?? [], cv?.skills ?? [])
  const certifications = (cv?.additional ?? []).filter((row) => row.category === 'certification')
  const { timeline, kinds } = await buildTimeline(extended.id, cv, filteredBadges, permitted)
  const skills = buildSkillDisplays(
    context.skills,
    cv?.skills ?? [],
    cv?.experience ?? [],
    projects,
  )

  const projection: IndividualProfileProjection = {
    viewState: 'public',
    profileId: extended.id,
    identity: buildIdentity(context, extended, fieldLabel, permitted.showGraduateBadge, cv),
    portfolioUrl,
    portfolio: buildPortfolioPreview(portfolioUrl, projects, extended.about_me),
    overview: extended.about_me,
    sections: toSectionVisibility(permitted),
    skills,
    education: cv?.education ?? [],
    experience: cv?.experience ?? [],
    certifications,
    projects,
    timeline,
    timelineKinds: kinds,
    canvas: buildCanvasSummary(extended),
    badges: filteredBadges,
    mentorship: null,
    evidenceVaultAvailable: false,
    allowContact: permitted.showContact,
    showSaveAction: permitted.showSaveAction,
  }

  return stripOwnerOnlyProjectionFields(projection) as IndividualProfileProjection
}

function buildRestrictedProjection(context: ProfilePageContext): IndividualProfileProjection {
  const { profile } = context
  return {
    viewState: 'restricted',
    profileId: profile.id,
    identity: {
      fullName: profile.full_name,
      headline: null,
      avatarUrl: null,
      city: null,
      fieldLabel: null,
      universityName: null,
      collegeName: null,
      graduationYear: null,
      employmentStatus: null,
      showGraduateBadge: false,
    },
    portfolioUrl: null,
    portfolio: { url: null, previewText: null },
    overview: null,
    sections: emptyRestrictedSections(),
    skills: [],
    education: [],
    experience: [],
    certifications: [],
    projects: [],
    timeline: [],
    timelineKinds: [],
    canvas: { available: false, direction: null, aspiration: null, highlights: [] },
    badges: [],
    mentorship: null,
    evidenceVaultAvailable: false,
  }
}

export type ResolveIndividualProfileOptions = {
  forcePublicPreview?: boolean
}

export type IndividualProfileResolution =
  | { status: 'not_found' }
  | { status: 'deleted' }
  | { status: 'suspended_admin'; context: ProfilePageContext; profile: ProfileRecord }
  | { status: 'ok'; projection: IndividualProfileProjection }

export async function resolveIndividualProfilePage(
  profileId: string,
  options: ResolveIndividualProfileOptions = {},
): Promise<IndividualProfileResolution> {
  const viewer = await getCurrentViewer()
  const context = await fetchProfilePageContext(profileId)
  if (!context) return { status: 'not_found' }

  const { profile } = context
  if (profile.deleted_at || profile.profile_state === 'deleted') {
    return { status: 'deleted' }
  }

  const isSuspended =
    Boolean(profile.suspended_at) || profile.profile_state === 'suspended'
  if (isSuspended) {
    if (viewer.isAdmin || isPrivilegedStaffRole(viewer.role)) {
      return { status: 'suspended_admin', context, profile }
    }
    return { status: 'not_found' }
  }

  const extended = await fetchExtendedProfile(profileId)
  if (!extended) return { status: 'not_found' }

  const isOwner = viewer.userId === profile.id
  const fieldLabel = await resolveMajorName(extended.major_id)

  if (isOwner && options.forcePublicPreview) {
    return {
      status: 'ok',
      projection: await buildPublicProjection(context, extended, fieldLabel, viewer, true),
    }
  }

  if (isOwner) {
    return {
      status: 'ok',
      projection: await buildOwnerProjection(context, extended, fieldLabel, viewer),
    }
  }

  if (!canViewerSeeProfile(viewer, profile)) {
    return { status: 'ok', projection: buildRestrictedProjection(context) }
  }

  return {
    status: 'ok',
    projection: await buildPublicProjection(context, extended, fieldLabel, viewer),
  }
}
