import 'server-only'

import type { ProfileRecord, ProfileViewer } from '@/lib/profile/types'
import { canViewerSeeProfile } from '@/lib/profile/visibility-rules'

/**
 * Task 13 — server-side field permissions (sole gate for Public View data).
 * Maps existing profile privacy switches to section-level visibility.
 */
export type PermittedProfileFields = {
  viewState: 'owner' | 'public' | 'restricted'
  showOverview: boolean
  showCanvas: boolean
  showTimeline: boolean
  showProjects: boolean
  showExperience: boolean
  showEducation: boolean
  showSkills: boolean
  showCertifications: boolean
  showMentorship: boolean
  showAchievements: boolean
  showPortfolio: boolean
  showCvBuilder: boolean
  showOwnerStats: boolean
  showApplicationTimeline: boolean
  showMentorIdentifyingInfo: boolean
  showGraduateBadge: boolean
  showContact: boolean
  showSaveAction: boolean
}

export type PrivacyProfileInput = Pick<
  ProfileRecord,
  | 'id'
  | 'visibility'
  | 'show_profile_to_companies'
  | 'show_profile_in_university_stats'
  | 'about_me'
  | 'suspended_at'
  | 'deleted_at'
  | 'profile_state'
> & {
  allow_company_direct_contact?: boolean
}

export type ResolvePermittedFieldsOptions = {
  forcePublicPreview?: boolean
}

/**
 * `(profileOwnerId, viewerContext) => permittedFields`
 * Owner session → full L1–L5. Everyone else → L6 projection only.
 */
export function resolvePermittedFields(
  profile: PrivacyProfileInput,
  viewer: ProfileViewer,
  options: ResolvePermittedFieldsOptions = {},
): PermittedProfileFields {
  const isOwner = viewer.userId === profile.id
  const canView = canViewerSeeProfile(viewer, profile)
  const asOwner = isOwner && !options.forcePublicPreview

  if (!canView) {
    return {
      viewState: 'restricted',
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
      showApplicationTimeline: false,
      showMentorIdentifyingInfo: false,
      showGraduateBadge: false,
      showContact: false,
      showSaveAction: false,
    }
  }

  if (asOwner) {
    return {
      viewState: 'owner',
      showOverview: true,
      showCanvas: true,
      showTimeline: true,
      showProjects: true,
      showExperience: true,
      showEducation: true,
      showSkills: true,
      showCertifications: true,
      showMentorship: true,
      showAchievements: true,
      showPortfolio: true,
      showCvBuilder: true,
      showOwnerStats: true,
      showApplicationTimeline: true,
      showMentorIdentifyingInfo: true,
      showGraduateBadge: profile.show_profile_in_university_stats,
      showContact: false,
      showSaveAction: false,
    }
  }

  // Public / discoverable L6 projection — no per-section switches exist today.
  return {
    viewState: 'public',
    showOverview: Boolean(profile.about_me?.trim()),
    showCanvas: true,
    showTimeline: true,
    showProjects: true,
    showExperience: true,
    showEducation: true,
    showSkills: true,
    showCertifications: true,
    // No granular mentorship consent column — omit identifying mentorship from public.
    showMentorship: false,
    showAchievements: true,
    showPortfolio: true,
    showCvBuilder: false,
    showOwnerStats: false,
    showApplicationTimeline: false,
    showMentorIdentifyingInfo: false,
    showGraduateBadge: profile.show_profile_in_university_stats,
    showContact: Boolean(profile.allow_company_direct_contact),
    showSaveAction: false,
  }
}

/** Privacy switchboard gaps — documented for Task 13 deliverable. */
export const PRIVACY_SWITCHBOARD_GAPS = [
  'No per-section toggles (skills vs experience vs projects).',
  'No mentorship granular consent — public view omits mentorship entirely.',
  'No project-level or certificate-level visibility controls.',
  'No evidence-vault sharing switch (module not shipped).',
  'Graduate badge tied only to show_profile_in_university_stats.',
  'Contact gated only by allow_company_direct_contact — no role-specific relay prefs.',
] as const

/** Defense-in-depth: strip owner-only keys before any public client boundary. */
export function stripOwnerOnlyProjectionFields<T extends Record<string, unknown>>(payload: T): T {
  const {
    completionPct: _c,
    completionMissing: _m,
    graduateBadgeVisibleInDirectory: _g,
    privacySettings: _p,
    publicPreviewHref: _h,
    ownerStats: _o,
    ...safe
  } = payload
  return safe as T
}
