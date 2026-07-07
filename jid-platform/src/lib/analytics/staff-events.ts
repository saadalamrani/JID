/** Section 17 — Staff operations portal analytics events. */
export const STAFF_ANALYTICS_EVENTS = [
  'staff.login_succeeded',
  'staff.mfa_verified',
  'staff.dashboard_viewed',
  'staff.claim_reviewed',
  'staff.mentor_application_reviewed',
  'staff.user_suspended',
  'staff.user_reinstated',
  'staff.flag_resolved',
  'staff.entity_metadata_updated',
  'staff.audit_viewed',
] as const

export type StaffAnalyticsEvent = (typeof STAFF_ANALYTICS_EVENTS)[number]
