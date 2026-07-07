import type { NotificationCategory } from '@/lib/notifications/types'

/** Section 7.5 — grouped notification categories for the preferences matrix. */
export type NotificationCategoryGroup = {
  id: string
  categories: readonly NotificationCategory[]
}

export const CATEGORY_GROUPS = [
  {
    id: 'auth',
    categories: [
      'auth.email_verified',
      'auth.mfa_disabled',
      'auth.mfa_enabled',
      'auth.new_device_login',
      'auth.password_changed',
      'auth.password_reset_requested',
      'auth.phone_verified',
      'auth.session_revoked',
    ],
  },
  {
    id: 'account',
    categories: ['account.reinstated', 'account.suspended'],
  },
  {
    id: 'claim',
    categories: ['claim.approved', 'claim.needs_more_info', 'claim.rejected'],
  },
  {
    id: 'company',
    categories: ['company.link_broken'],
  },
  {
    id: 'job',
    categories: [
      'job.application_expired',
      'job.application_received',
      'job.application_status_changed',
      'job.expiring_soon',
      'job.posted',
    ],
  },
  {
    id: 'legal',
    categories: ['legal.privacy_updated', 'legal.terms_updated'],
  },
  {
    id: 'mentor',
    categories: ['mentor.application_approved', 'mentor.application_rejected'],
  },
  {
    id: 'mentorship',
    categories: [
      'mentorship.feedback_requested',
      'mentorship.meeting_confirmed',
      'mentorship.meeting_proposed',
      'mentorship.meeting_reminder',
      'mentorship.request_accepted',
      'mentorship.request_declined',
      'mentorship.request_received',
    ],
  },
  {
    id: 'staff',
    categories: ['staff.claim_assigned'],
  },
  {
    id: 'digest',
    categories: ['digest.daily_summary'],
  },
] as const satisfies readonly NotificationCategoryGroup[]

export const MATRIX_CATEGORIES = CATEGORY_GROUPS.flatMap((group) => group.categories)
