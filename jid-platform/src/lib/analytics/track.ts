'use client'

import { PULSE_ANALYTICS_EVENTS, type PulseAnalyticsEvent } from '@/lib/analytics/pulse-events'
import { STAFF_ANALYTICS_EVENTS, type StaffAnalyticsEvent } from '@/lib/analytics/staff-events'
import { SYS_ANALYTICS_EVENTS, type SysAnalyticsEvent } from '@/lib/analytics/sys-events'

/**
 * Section 11 — mentorship analytics events (PostHog).
 * Job-board events remain in the same module for a single capture surface.
 */

export const JOB_ANALYTICS_EVENTS = [
  'job_viewed',
  'job_apply_clicked',
  'job_self_declared',
  'job_interceptor_shown',
  'job_status_changed',
  'job_filter_applied',
  'job_posted',
  'rejection_email_sent',
] as const

export const MENTORSHIP_ANALYTICS_EVENTS = [
  'mentor_discovered',
  'mentor_viewed',
  'mentorship_request_submitted',
  'mentorship_request_accepted',
  'mentorship_request_declined',
  'conversation_opened',
  'meeting_proposed',
  'meeting_confirmed',
  'meeting_feedback_submitted',
  'workshop_created',
  'workshop_published',
  'mentor_share_card_downloaded',
  'mentor_notification_requested',
] as const

/** Section 15 — CV builder analytics events. */
export const CV_ANALYTICS_EVENTS = [
  'cv_builder_opened',
  'cv_section_completed',
  'cv_auto_filled_from_profile',
  'cv_pdf_generated',
  'cv_pdf_failed',
  'cv_overflow_warning_shown',
  'cv_section_abandoned',
] as const

/** Section 15 — Opportunity Radar analytics events. */
export const RADAR_ANALYTICS_EVENTS = [
  'radar_viewed',
  'radar_card_dragged',
  'radar_card_drag_blocked',
  'radar_status_updated_by_company',
  'radar_glow_seen',
  'radar_meeting_opened',
  'radar_meeting_joined',
  'radar_feedback_submitted',
  'radar_feedback_dismissed',
  'mode_switched',
] as const

/** Section 14 — Platform Pulse analytics events. */
export { PULSE_ANALYTICS_EVENTS, type PulseAnalyticsEvent } from '@/lib/analytics/pulse-events'

/** University pillar MVP analytics events (Section 10). */
export const UNIVERSITY_ANALYTICS_EVENTS = [
  'student_university_selected',
  'university_dashboard_viewed',
  'university_signup_initiated',
  'university_claim_submitted',
  'university_dashboard_pdf_exported',
] as const

export const ANALYTICS_EVENTS = [
  ...JOB_ANALYTICS_EVENTS,
  ...MENTORSHIP_ANALYTICS_EVENTS,
  ...CV_ANALYTICS_EVENTS,
  ...RADAR_ANALYTICS_EVENTS,
  ...PULSE_ANALYTICS_EVENTS,
  ...UNIVERSITY_ANALYTICS_EVENTS,
  ...STAFF_ANALYTICS_EVENTS,
  ...SYS_ANALYTICS_EVENTS,
] as const

export type AnalyticsEvent =
  | (typeof ANALYTICS_EVENTS)[number]
  | PulseAnalyticsEvent
  | StaffAnalyticsEvent
  | SysAnalyticsEvent

const DISTINCT_ID_KEY = 'jid_analytics_distinct_id'

function getDistinctId(): string {
  if (typeof window === 'undefined') return 'server'
  const existing = localStorage.getItem(DISTINCT_ID_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(DISTINCT_ID_KEY, id)
  return id
}

export function setAnalyticsUserId(userId: string | null) {
  if (typeof window === 'undefined' || !userId) return
  localStorage.setItem(DISTINCT_ID_KEY, userId)
}

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', event, properties)
    }
    return
  }

  void fetch(`${host}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      event,
      distinct_id: getDistinctId(),
      properties: {
        ...properties,
        $lib: 'jid-web',
      },
    }),
    keepalive: true,
  }).catch(() => {
    /* best-effort */
  })
}
