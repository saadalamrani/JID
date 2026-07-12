import type { CareerTimelineEntry, CareerTimelineEntryKind } from '@/lib/profile/career-timeline'
import type { CompletionBreakdownItem } from '@/lib/profile/completion-breakdown'
import type { EarnedUserBadge } from '@/lib/profile/types'
import type { CvAdditionalRecord, CvEducationRecord, CvExperienceRecord } from '@/types/cv'
import type { PermittedProfileFields } from '@/lib/profile/individual-privacy-projection'

export type IndividualProfileViewState = 'owner' | 'public' | 'restricted' | 'suspended_admin'

export type IndividualProfileSectionId =
  | 'overview'
  | 'canvas'
  | 'timeline'
  | 'projects'
  | 'experience'
  | 'skills'
  | 'education'
  | 'certifications'
  | 'mentorship'
  | 'achievements'
  | 'portfolio'
  | 'cv'

export type IndividualProfileIdentity = {
  fullName: string | null
  headline: string | null
  avatarUrl: string | null
  city: string | null
  fieldLabel: string | null
  universityName: string | null
  collegeName: string | null
  graduationYear: number | null
  employmentStatus: string | null
  showGraduateBadge: boolean
}

export type IndividualProfileProjectCard = {
  id: string
  title: string
  category: string
  description: string | null
  role: string | null
  dateLabel: string | null
  skills: string[]
  hasProof: boolean
  url: string | null
}

export type IndividualProfileCanvasSummary = {
  available: boolean
  direction: string | null
  aspiration: string | null
  highlights: string[]
}

export type ProfileSkillDisplay = {
  id: string
  name: string
  name_ar: string | null
  proficiency: string | null
  backingExperienceIds: string[]
  backingProjectIds: string[]
}

export type MentorshipSessionDisplay = {
  id: string
  scheduledAt: string | null
  status: string
  mentorName: string | null
}

export type MentorshipSummary = {
  sessionCount: number | null
  focusAreas: string[]
  goals: string[]
  showIdentifyingDetails: boolean
  sessions?: MentorshipSessionDisplay[]
}

export type OwnerStatsSnapshot = {
  activeApplications: number
  interviewCount: number
  radarLastUpdated: string | null
  completionPct: number
  projectCount: number
  proofCount?: number
}

export type PortfolioPreview = {
  url: string | null
  previewText: string | null
}

export type SectionVisibility = Pick<
  PermittedProfileFields,
  | 'showOverview'
  | 'showCanvas'
  | 'showTimeline'
  | 'showProjects'
  | 'showExperience'
  | 'showEducation'
  | 'showSkills'
  | 'showCertifications'
  | 'showMentorship'
  | 'showAchievements'
  | 'showPortfolio'
  | 'showCvBuilder'
  | 'showOwnerStats'
>

export type IndividualProfileProjection = {
  viewState: IndividualProfileViewState
  profileId: string
  identity: IndividualProfileIdentity
  portfolioUrl: string | null
  portfolio: PortfolioPreview
  overview: string | null
  sections: SectionVisibility
  skills: ProfileSkillDisplay[]
  education: CvEducationRecord[]
  experience: CvExperienceRecord[]
  certifications: CvAdditionalRecord[]
  projects: IndividualProfileProjectCard[]
  timeline: CareerTimelineEntry[]
  timelineKinds: CareerTimelineEntryKind[]
  canvas: IndividualProfileCanvasSummary
  badges: EarnedUserBadge[]
  mentorship: MentorshipSummary | null
  evidenceVaultAvailable: boolean
  /** Owner-only — never present in public projection */
  completionPct?: number
  completionMissing?: CompletionBreakdownItem[]
  graduateBadgeVisibleInDirectory?: boolean
  privacySettings?: {
    visibility: 'private' | 'discoverable'
    show_profile_to_companies: boolean
    show_profile_in_university_stats: boolean
  }
  allowContact?: boolean
  showSaveAction?: boolean
  publicPreviewHref?: string
  ownerStats?: OwnerStatsSnapshot
}
