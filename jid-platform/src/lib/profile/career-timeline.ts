import 'server-only'

import type { CvEducationRecord, CvExperienceRecord } from '@/types/cv'
import type { UserApplication } from '@/types/application'

export type CareerTimelineEntryKind =
  | 'education'
  | 'experience'
  | 'application'
  | 'mentorship'
  | 'profile_milestone'

export type CareerTimelineEntry = {
  id: string
  kind: CareerTimelineEntryKind
  title: string
  subtitle: string | null
  description: string | null
  occurredAt: string
  sortKey: number
  hasProof: boolean
  href: string | null
  meta?: Record<string, string>
}

type MentorshipRow = {
  id: string
  scheduled_at: string | null
  status: string
  mentor_name: string | null
}

function educationSortKey(row: CvEducationRecord): number {
  const year = row.end_year ?? row.graduation_year ?? row.start_year ?? 0
  return year * 100 + (row.end_month ?? row.start_month ?? 0)
}

function experienceSortKey(row: CvExperienceRecord): number {
  const year = row.end_year ?? row.start_year ?? 0
  return year * 100 + (row.end_month ?? row.start_month ?? 0)
}

function parseDate(iso: string | null | undefined): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? 0 : t
}

export function buildEducationTimelineEntries(rows: CvEducationRecord[]): CareerTimelineEntry[] {
  return rows.map((row) => ({
    id: `edu-${row.id}`,
    kind: 'education',
    title: row.degree?.trim() || row.field_of_study?.trim() || row.institution_name,
    subtitle: row.institution_name,
    description: row.honors ?? row.relevant_coursework ?? null,
    occurredAt: row.end_year
      ? `${row.end_year}-${String(row.end_month ?? 6).padStart(2, '0')}-01`
      : row.start_year
        ? `${row.start_year}-01-01`
        : new Date(row.created_at).toISOString(),
    sortKey: educationSortKey(row),
    hasProof: false,
    href: null,
  }))
}

export function buildExperienceTimelineEntries(rows: CvExperienceRecord[]): CareerTimelineEntry[] {
  return rows.map((row) => ({
    id: `exp-${row.id}`,
    kind: 'experience',
    title: row.job_title,
    subtitle: row.company_name,
    description: row.bullets?.[0] ?? null,
    occurredAt: row.end_year
      ? `${row.end_year}-${String(row.end_month ?? 6).padStart(2, '0')}-01`
      : row.start_year
        ? `${row.start_year}-01-01`
        : new Date(row.created_at).toISOString(),
    sortKey: experienceSortKey(row),
    hasProof: false,
    href: null,
  }))
}

export function buildApplicationTimelineEntries(
  applications: UserApplication[],
): CareerTimelineEntry[] {
  return applications.map((app) => ({
    id: `app-${app.id}`,
    kind: 'application',
    title: app.job?.title_ar ?? app.job?.title_en ?? 'Application',
    subtitle: app.company?.name_ar ?? app.company?.name_en ?? null,
    description: app.status,
    occurredAt: app.updated_at ?? app.submitted_at ?? app.created_at,
    sortKey: parseDate(app.updated_at ?? app.submitted_at ?? app.created_at),
    hasProof: false,
    href: '/radar',
  }))
}

export function buildMentorshipTimelineEntries(rows: MentorshipRow[]): CareerTimelineEntry[] {
  return rows
    .filter((row) => row.scheduled_at)
    .map((row) => ({
      id: `mentor-${row.id}`,
      kind: 'mentorship' as const,
      title: row.mentor_name ?? 'Mentorship session',
      subtitle: row.status,
      description: null,
      occurredAt: row.scheduled_at!,
      sortKey: parseDate(row.scheduled_at),
      hasProof: false,
      href: '/radar',
    }))
}

export function buildAwardTimelineEntries(
  badges: Array<{ slug: string; name_ar: string; name_en: string; awarded_at: string }>,
): CareerTimelineEntry[] {
  return badges.map((badge) => ({
    id: `badge-${badge.slug}`,
    kind: 'profile_milestone' as const,
    title: badge.name_ar || badge.name_en,
    subtitle: badge.slug,
    description: null,
    occurredAt: badge.awarded_at,
    sortKey: parseDate(badge.awarded_at),
    hasProof: false,
    href: null,
  }))
}

export function mergeTimelineEntries(entries: CareerTimelineEntry[]): CareerTimelineEntry[] {
  return [...entries].sort((a, b) => {
    if (b.sortKey !== a.sortKey) return b.sortKey - a.sortKey
    return b.occurredAt.localeCompare(a.occurredAt)
  })
}

export function filterTimelineByKinds(
  entries: CareerTimelineEntry[],
  kinds: CareerTimelineEntryKind[],
): CareerTimelineEntry[] {
  if (kinds.length === 0) return entries
  const allowed = new Set(kinds)
  return entries.filter((entry) => allowed.has(entry.kind))
}
