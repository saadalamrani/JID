/** Type-safe Platform Pulse / governance feature flag keys (Section 12 Step 1). */
export const FEATURE_FLAG_KEYS = {
  PLATFORM_PULSE_PUBLIC: 'platform_pulse_public',
  PLATFORM_PULSE_METRICS: 'platform_pulse_metrics',
  PLATFORM_PULSE_TRENDS: 'platform_pulse_trends',
  PLATFORM_PULSE_ANNOUNCEMENTS: 'platform_pulse_announcements',
} as const

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[keyof typeof FEATURE_FLAG_KEYS]

export const PLATFORM_PULSE_FLAG_KEYS = [
  FEATURE_FLAG_KEYS.PLATFORM_PULSE_PUBLIC,
  FEATURE_FLAG_KEYS.PLATFORM_PULSE_METRICS,
  FEATURE_FLAG_KEYS.PLATFORM_PULSE_TRENDS,
  FEATURE_FLAG_KEYS.PLATFORM_PULSE_ANNOUNCEMENTS,
] as const satisfies readonly FeatureFlagKey[]
