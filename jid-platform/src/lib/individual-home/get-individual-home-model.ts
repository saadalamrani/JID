import 'server-only'

import { getLocale } from 'next-intl/server'
import {
  getCurrentViewer,
  fetchOwnProfilePageContext,
  type ProfileSkillRow,
} from '@/lib/profile/queries'
import { fetchUserApplications } from '@/lib/queries/radar'
import { fetchJobs } from '@/lib/queries/jobs'
import { formatRelativeTime } from '@/lib/utils/format-relative-time'
import type { ApplicationStatus } from '@/types/application'
import type { JobCardData } from '@/types/job'

/**
 * D1 R2 — Individual Home data model.
 *
 * Real product contracts only (`getCurrentViewer`, `fetchOwnProfilePageContext`,
 * `fetchUserApplications`, `fetchJobs`) — no fabricated metrics, no invented
 * matching score. `opportunities` deliberately shows the latest genuinely open
 * opportunities rather than a personalized "match" claim: JID does not yet have a
 * real, explainable matching-criteria system live (R1-C Article 4 — no percentage
 * or ranking without a genuine measurement behind it), so this checkpoint states
 * what is honestly true ("latest available") instead of fabricating "why this
 * matched you". A criteria-aware match explanation is `NEEDS_D1_EXPERIMENT` for R4.
 */

export type AttentionItem =
  | { kind: 'incomplete_profile'; href: string }
  | { kind: 'application_invited'; href: string; jobTitle: string }

export type ChangeItem = {
  id: string
  jobTitle: string
  status: ApplicationStatus
  at: string
}

export type ApplicationSummary = {
  id: string
  jobTitle: string
  companyName: string | null
  status: ApplicationStatus
  href: string
}

export type IndividualHomeModel = {
  userId: string
  fullName: string | null
  profileState: string
  updatedAt: string | null
  skillCount: number
  skills: ProfileSkillRow[]
  universityName: string | null
  attention: AttentionItem[]
  changes: ChangeItem[]
  applications: ApplicationSummary[]
  opportunities: JobCardData[]
  locale: 'ar' | 'en'
}

const RECENT_CHANGE_LIMIT = 3
const APPLICATION_PREVIEW_LIMIT = 4
const OPPORTUNITY_PREVIEW_LIMIT = 4

/** True once a status change is something the individual submitted before now. */
function hasStatusHistory(status: ApplicationStatus): boolean {
  return status !== 'draft' && status !== 'saved'
}

export async function getIndividualHomeModel(): Promise<IndividualHomeModel | null> {
  const viewer = await getCurrentViewer()
  if (!viewer.userId) return null

  const locale = (await getLocale()) === 'en' ? 'en' : 'ar'

  const [profileContext, applicationsResult, opportunitiesResult] = await Promise.all([
    fetchOwnProfilePageContext(),
    fetchUserApplications(viewer.userId),
    fetchJobs({ limit: OPPORTUNITY_PREVIEW_LIMIT, sort: 'published_at_desc' }),
  ])

  const profile = profileContext?.profile ?? null
  const applications = applicationsResult.applications

  const localized = (ar: string | null | undefined, en: string | null | undefined): string =>
    (locale === 'en' ? (en ?? ar) : (ar ?? en)) ?? ''

  const attention: AttentionItem[] = []
  if (profile && profile.profile_state === 'incomplete') {
    attention.push({ kind: 'incomplete_profile', href: '/profile/edit' })
  }
  for (const application of applications) {
    if (application.status === 'invited' && application.job) {
      attention.push({
        kind: 'application_invited',
        href: `/opportunities/${application.job.id}`,
        jobTitle: localized(application.job.title_ar, application.job.title_en),
      })
    }
  }

  const changes: ChangeItem[] = applications
    .filter((application) => hasStatusHistory(application.status) && application.status_changed_at)
    .sort(
      (a, b) =>
        new Date(b.status_changed_at ?? 0).getTime() - new Date(a.status_changed_at ?? 0).getTime(),
    )
    .slice(0, RECENT_CHANGE_LIMIT)
    .map((application) => ({
      id: application.id,
      jobTitle: localized(application.job?.title_ar, application.job?.title_en),
      status: application.status,
      at: application.status_changed_at ?? application.updated_at,
    }))

  const applicationSummaries: ApplicationSummary[] = applications
    .slice(0, APPLICATION_PREVIEW_LIMIT)
    .map((application) => ({
      id: application.id,
      jobTitle: localized(application.job?.title_ar, application.job?.title_en),
      companyName: localized(application.company?.name_ar, application.company?.name_en) || null,
      status: application.status,
      href: `/radar`,
    }))

  return {
    userId: viewer.userId,
    fullName: profile?.full_name ?? null,
    profileState: profile?.profile_state ?? 'incomplete',
    updatedAt: profile?.updated_at ?? null,
    skillCount: profileContext?.skillCount ?? 0,
    skills: profileContext?.skills ?? [],
    universityName: profileContext?.universityName ?? null,
    attention,
    changes,
    applications: applicationSummaries,
    opportunities: opportunitiesResult.jobs,
    locale,
  }
}

export function relativeTimeFor(iso: string | null, locale: 'ar' | 'en'): string {
  return formatRelativeTime(iso, locale)
}
