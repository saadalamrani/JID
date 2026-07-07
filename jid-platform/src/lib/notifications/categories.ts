import type { NotificationCategory } from '@/lib/notifications/types'

/** All `notification_category_enum` values — SSOT for filters and validation. */
export const NOTIFICATION_CATEGORIES = [
  'auth.email_verified',
  'auth.mfa_disabled',
  'auth.mfa_enabled',
  'auth.new_device_login',
  'auth.password_changed',
  'auth.password_reset_requested',
  'auth.phone_verified',
  'auth.session_revoked',
  'account.reinstated',
  'account.suspended',
  'claim.approved',
  'claim.needs_more_info',
  'claim.rejected',
  'company.link_broken',
  'job.application_expired',
  'job.application_received',
  'job.application_status_changed',
  'job.expiring_soon',
  'job.posted',
  'legal.privacy_updated',
  'legal.terms_updated',
  'mentor.application_approved',
  'mentor.application_rejected',
  'mentorship.feedback_requested',
  'mentorship.meeting_confirmed',
  'mentorship.meeting_proposed',
  'mentorship.meeting_reminder',
  'mentorship.request_accepted',
  'mentorship.request_declined',
  'mentorship.request_received',
  'staff.claim_assigned',
  'digest.daily_summary',
] as const satisfies readonly NotificationCategory[]

export type NotificationCategoryFilter = (typeof NOTIFICATION_CATEGORIES)[number]

export function parseNotificationCategory(
  value: string | null | undefined,
): NotificationCategory | null {
  if (!value || value === 'all') return null
  return (NOTIFICATION_CATEGORIES as readonly string[]).includes(value)
    ? (value as NotificationCategory)
    : null
}
