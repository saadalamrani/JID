import type { NotificationCategory } from '@/lib/notifications/types'

/** Mirrors `public.is_category_mandatory` (081_notifications_schema.sql). */
export const MANDATORY_NOTIFICATION_CATEGORIES = [
  'legal.terms_updated',
  'legal.privacy_updated',
  'account.suspended',
  'auth.password_changed',
  'auth.session_revoked',
  'auth.new_device_login',
  'auth.password_reset_requested',
] as const satisfies readonly NotificationCategory[]

export function isMandatoryNotificationCategory(category: NotificationCategory): boolean {
  return (MANDATORY_NOTIFICATION_CATEGORIES as readonly string[]).includes(category)
}

/** Mirrors `public.get_default_email_pref`. */
const DEFAULT_EMAIL_ON = new Set<string>([
  'auth.email_verified',
  'auth.mfa_disabled',
  'auth.mfa_enabled',
  'auth.new_device_login',
  'auth.password_changed',
  'auth.password_reset_requested',
  'auth.phone_verified',
  'auth.session_revoked',
  'account.suspended',
  'account.reinstated',
  'claim.approved',
  'claim.rejected',
  'claim.needs_more_info',
  'mentor.application_approved',
  'mentor.application_rejected',
  'job.application_status_changed',
  'job.application_expired',
  'legal.terms_updated',
  'legal.privacy_updated',
    'mentorship.meeting_confirmed',
    'mentorship.meeting_reminder',
    'digest.daily_summary',
  ])

/** Mirrors `public.get_default_digest_pref`. */
const DEFAULT_DIGEST_ON = new Set<string>([
  'job.application_received',
  'job.posted',
  'job.expiring_soon',
  'mentorship.request_received',
  'mentorship.request_accepted',
  'mentorship.request_declined',
  'mentorship.meeting_proposed',
  'mentorship.feedback_requested',
  'company.link_broken',
  'staff.claim_assigned',
])

export function getDefaultEmailPref(category: NotificationCategory): boolean {
  return DEFAULT_EMAIL_ON.has(category)
}

export function getDefaultDigestPref(category: NotificationCategory): boolean {
  return DEFAULT_DIGEST_ON.has(category)
}

export type StoredNotificationPreference = {
  category: NotificationCategory
  in_app_enabled: boolean
  email_enabled: boolean
  include_in_digest: boolean
}

export type ResolvedNotificationPreference = {
  category: NotificationCategory
  in_app_enabled: boolean
  email_enabled: boolean
  include_in_digest: boolean
  is_mandatory: boolean
  has_user_override: boolean
}

export function resolveNotificationPreference(
  category: NotificationCategory,
  stored: StoredNotificationPreference | undefined,
): ResolvedNotificationPreference {
  const mandatory = isMandatoryNotificationCategory(category)
  const in_app_enabled = stored?.in_app_enabled ?? true
  const email_enabled = stored?.email_enabled ?? getDefaultEmailPref(category)
  const include_in_digest = stored?.include_in_digest ?? getDefaultDigestPref(category)

  if (mandatory) {
    return {
      category,
      in_app_enabled: true,
      email_enabled: true,
      include_in_digest,
      is_mandatory: true,
      has_user_override: stored != null,
    }
  }

  return {
    category,
    in_app_enabled,
    email_enabled,
    include_in_digest,
    is_mandatory: false,
    has_user_override: stored != null,
  }
}

export type NotificationPreferenceChannel = 'in_app' | 'email' | 'digest'

export function channelColumn(
  channel: NotificationPreferenceChannel,
): keyof Pick<StoredNotificationPreference, 'in_app_enabled' | 'email_enabled' | 'include_in_digest'> {
  switch (channel) {
    case 'in_app':
      return 'in_app_enabled'
    case 'email':
      return 'email_enabled'
    case 'digest':
      return 'include_in_digest'
  }
}
