/** Section 16 — Super Admin portal analytics events. */
export const SYS_ANALYTICS_EVENTS = [
  'sys.login_succeeded',
  'sys.mfa_verified',
  'sys.dashboard_viewed',
  'sys.emergency_maintenance_enabled',
  'sys.emergency_maintenance_disabled',
  'sys.emergency_registrations_closed',
  'sys.emergency_registrations_opened',
  'sys.session_revoked',
  'sys.sessions_bulk_revoked',
  'sys.audit_exported',
  'sys.config_updated',
  'sys.user_suspended',
  'sys.user_role_changed',
  'sys.flag_toggled',
] as const

export type SysAnalyticsEvent = (typeof SYS_ANALYTICS_EVENTS)[number]
