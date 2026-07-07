/** Section 14 — Platform Pulse analytics events. */
export const PULSE_ANALYTICS_EVENTS = [
  'pulse_viewed',
  'pulse_announcement_viewed',
  'pulse_carousel_paused',
  'pulse_metric_animated_into_view',
  'pulse_admin_flag_toggled',
  'pulse_announcement_created',
] as const

export type PulseAnalyticsEvent = (typeof PULSE_ANALYTICS_EVENTS)[number]
