/** Master Prompt Section 3.1 — canonical module + granular feature flag keys. */
export const FLAG_KEYS = {
  PULSE: 'pulse',
  MENTORSHIP: 'mentorship',
  CV_BUILDER: 'cv_builder',
  UNIVERSITIES: 'universities',
  RADAR: 'radar',
  JOBS: 'jobs',
  PROFILE: 'profile',

  PULSE_PUBLIC: 'platform_pulse_public',
  PULSE_BILLBOARD: 'platform_pulse_announcements',
  PULSE_LIVE_METRICS: 'platform_pulse_metrics',
  PULSE_MARKET_TRENDS: 'platform_pulse_trends',

  UNIVERSITIES_DISCOVER: 'universities.discover',

  CV_BUILDER_SMART_HINTS: 'cv_builder.smart_hints',

  JOBS_SMART_MATCHING: 'jobs.smart_matching',
  JOBS_APPLICATION_ANALYTICS: 'jobs.application_analytics',

  RADAR_REALTIME_UPDATES: 'radar.realtime_updates',

  MENTORSHIP_DISCOVERY: 'mentorship.discovery',
} as const

export type FlagKey = (typeof FLAG_KEYS)[keyof typeof FLAG_KEYS]

export const ALL_FLAG_KEYS = Object.values(FLAG_KEYS) as readonly FlagKey[]
