/** Section 20 — Public pages + onboarding analytics events. */
export const ONBOARDING_ANALYTICS_EVENTS = [
  'landing_page_viewed',
  'legal_page_viewed',
  'onboarding_welcome_viewed',
  'onboarding_step_one_saved',
  'onboarding_step_two_saved',
  'onboarding_step_three_saved',
  'onboarding_completed',
  'onboarding_skipped',
  'entity_setup_viewed',
  'entity_profile_saved',
  'entity_team_invites_sent',
  'entity_setup_completed',
  'mentor_setup_completed',
] as const

export type OnboardingAnalyticsEvent = (typeof ONBOARDING_ANALYTICS_EVENTS)[number]
