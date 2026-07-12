import 'server-only'

import type { CvAdditionalRecord, CvEducationRecord, CvExperienceRecord, CvSkillRecord } from '@/types/cv'
import type { UserApplication } from '@/types/application'
import type { ProfileSkillRow } from '@/lib/profile/queries'
import type { EarnedUserBadge } from '@/lib/profile/types'
import { CV_SKILL_PROFICIENCY_LEVELS } from '@/lib/cv/schemas/skills'
import { buildAwardTimelineEntries } from '@/lib/profile/career-timeline'
import type {
  IndividualProfileProjectCard,
  MentorshipSummary,
  OwnerStatsSnapshot,
  PortfolioPreview,
  ProfileSkillDisplay,
} from '@/lib/profile/individual-projection-types'

const ACTIVE_APPLICATION_STATUSES = new Set<UserApplication['status']>([
  'pending',
  'submitted',
  'under_review',
  'shortlisted',
  'invited',
])

function normalizeSkillToken(value: string): string {
  return value.trim().toLowerCase()
}

function skillMentionedInText(skillName: string, text: string | null | undefined): boolean {
  if (!text?.trim()) return false
  return normalizeSkillToken(text).includes(normalizeSkillToken(skillName))
}

function resolveCvProficiency(
  profileSkill: ProfileSkillRow,
  cvSkills: CvSkillRecord[],
): string | null {
  const name = normalizeSkillToken(profileSkill.name_ar ?? profileSkill.name)
  const match = cvSkills.find((row) => normalizeSkillToken(row.skill_name) === name)
  if (!match?.proficiency) return null
  if (!(CV_SKILL_PROFICIENCY_LEVELS as readonly string[]).includes(match.proficiency)) {
    return null
  }
  return match.proficiency
}

export function buildSkillDisplays(
  profileSkills: ProfileSkillRow[],
  cvSkills: CvSkillRecord[],
  experience: CvExperienceRecord[],
  projects: IndividualProfileProjectCard[],
): ProfileSkillDisplay[] {
  return profileSkills.map((skill) => {
    const label = skill.name_ar ?? skill.name
    const backingExperienceIds = experience
      .filter(
        (row) =>
          skillMentionedInText(label, row.job_title) ||
          row.bullets.some((bullet) => skillMentionedInText(label, bullet)),
      )
      .map((row) => row.id)

    const backingProjectIds = projects
      .filter(
        (row) =>
          skillMentionedInText(label, row.title) ||
          skillMentionedInText(label, row.description),
      )
      .map((row) => row.id)

    return {
      id: skill.id,
      name: skill.name,
      name_ar: skill.name_ar,
      proficiency: resolveCvProficiency(skill, cvSkills),
      backingExperienceIds,
      backingProjectIds,
    }
  })
}

export function buildOwnerStats(
  applications: UserApplication[],
  completionPct: number,
  projectCount: number,
  evidenceVaultAvailable: boolean,
  proofCount: number,
): OwnerStatsSnapshot {
  const activeApplications = applications.filter((app) =>
    ACTIVE_APPLICATION_STATUSES.has(app.status),
  ).length

  const interviewCount = applications.filter((app) => app.status === 'invited').length

  const radarLastUpdated = applications.reduce<string | null>((latest, app) => {
    const candidate = app.updated_at ?? app.submitted_at ?? app.created_at
    if (!candidate) return latest
    if (!latest) return candidate
    return candidate > latest ? candidate : latest
  }, null)

  const stats: OwnerStatsSnapshot = {
    activeApplications,
    interviewCount,
    radarLastUpdated,
    completionPct,
    projectCount,
  }

  if (evidenceVaultAvailable) {
    stats.proofCount = proofCount
  }

  return stats
}

type MentorshipRequestRow = {
  id: string
  focus_area: string | null
  intent_statement: string | null
  status: string
}

type MentorshipMeetingRow = {
  id: string
  scheduled_at: string | null
  status: string
  mentor_name: string | null
}

export function buildMentorshipSummary(
  requests: MentorshipRequestRow[],
  meetings: MentorshipMeetingRow[],
  goals: string[],
  showIdentifyingDetails: boolean,
): MentorshipSummary {
  const focusAreas = Array.from(
    new Set(
      requests
        .map((row) => row.focus_area?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  )

  const completedSessions = meetings.filter(
    (row) => row.status === 'completed' || row.status === 'confirmed',
  )

  return {
    sessionCount: completedSessions.length > 0 ? completedSessions.length : null,
    focusAreas,
    goals: goals.slice(0, 5),
    showIdentifyingDetails,
    sessions: showIdentifyingDetails
      ? meetings.map((row) => ({
          id: row.id,
          scheduledAt: row.scheduled_at,
          status: row.status,
          mentorName: row.mentor_name,
        }))
      : undefined,
  }
}

export function buildPortfolioPreview(
  portfolioUrl: string | null,
  projects: IndividualProfileProjectCard[],
  aboutMe: string | null,
): PortfolioPreview {
  if (!portfolioUrl && projects.length === 0) {
    return { url: null, previewText: null }
  }

  const firstProject = projects[0]
  const previewText =
    firstProject?.description?.trim() ||
    (firstProject ? `${firstProject.title}${firstProject.role ? ` — ${firstProject.role}` : ''}` : null) ||
    aboutMe?.trim().slice(0, 160) ||
    null

  return {
    url: portfolioUrl,
    previewText,
  }
}

export function mapProjectsWithSkills(
  additional: CvAdditionalRecord[],
  cvSkills: CvSkillRecord[],
): IndividualProfileProjectCard[] {
  return additional
    .filter((row) => row.category === 'project')
    .slice(0, 6)
    .map((row) => {
      const matchedSkills = cvSkills
        .filter(
          (skill) =>
            skillMentionedInText(skill.skill_name, row.title) ||
            skillMentionedInText(skill.skill_name, row.description),
        )
        .map((skill) => skill.skill_name)

      return {
        id: row.id,
        title: row.title,
        category: row.category,
        description: row.description,
        role: row.issuer,
        dateLabel: row.start_date ?? row.end_date,
        skills: matchedSkills,
        hasProof: false,
        url: row.url,
      }
    })
}

export function formatEducationDateRange(row: CvEducationRecord): string | null {
  if (row.start_year && row.end_year) {
    return `${row.start_year} – ${row.end_year}`
  }
  if (row.graduation_year) return String(row.graduation_year)
  if (row.end_year) return String(row.end_year)
  if (row.start_year) return String(row.start_year)
  return null
}

export function formatExperienceDateRange(row: CvExperienceRecord): string | null {
  const start =
    row.start_year != null
      ? `${row.start_year}${row.start_month ? `/${row.start_month}` : ''}`
      : null
  const end = row.is_current
    ? 'present'
    : row.end_year != null
      ? `${row.end_year}${row.end_month ? `/${row.end_month}` : ''}`
      : null
  if (start && end) return `${start} – ${end}`
  return start ?? end
}

export function linkBadgesToTimeline(
  badges: EarnedUserBadge[],
  existingTimelineIds: Set<string>,
): ReturnType<typeof buildAwardTimelineEntries> {
  return buildAwardTimelineEntries(badges).filter((entry) => !existingTimelineIds.has(entry.id))
}
