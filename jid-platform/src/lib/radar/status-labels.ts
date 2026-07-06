import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '@/types/application'
import type { RadarColumnId } from '@/lib/radar/column-config'

/** Section 7.1 — human-readable application status labels (Arabic SSOT). */
export function applicationStatusLabel(status: ApplicationStatus): string {
  return APPLICATION_STATUS_LABELS[status]
}

/** Section 7.1 — Kanban column title keys resolved client-side via next-intl. */
export const RADAR_COLUMN_LABEL_KEYS: Record<RadarColumnId, `radar.columns.${string}`> = {
  saved: 'radar.columns.saved',
  applied: 'radar.columns.applied',
  under_review: 'radar.columns.under_review',
  archived: 'radar.columns.archived',
}

/** Section 7.4 — archived card sub-status badge labels (Arabic SSOT). */
export const ARCHIVED_SUB_STATUS_LABELS = {
  shortlisted: 'قُبل',
  rejected: 'رفض',
  expired: 'انتهت المدة',
} as const

const MEETING_STATUS_LABELS: Record<string, string> = {
  pending_confirmation: 'بانتظار التأكيد',
  scheduled: 'مجدول',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغى',
  no_show: 'لم يحضر',
}

/** Timeline meeting status label for Radar sidebar (Section 8.1). */
export function meetingStatusLabel(status: string): string {
  return MEETING_STATUS_LABELS[status] ?? status
}
