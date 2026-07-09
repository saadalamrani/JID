/**
 * Model 1 entitlement registry — the only valid feature keys (Prompt 0).
 * Importing a non-registry key should be a TypeScript error at call sites.
 */

export const MODEL1_FEATURE_KEYS = [
  'cv_pro_formats',
  'search_for_me',
  'lammah_feed',
  'smart_communication',
  'ssis',
  'priority_visibility',
] as const

export type Model1FeatureKey = (typeof MODEL1_FEATURE_KEYS)[number]

/** B2C JID Plus — gated via `has_entitlement` / `get_my_entitlements`. */
export const JID_PLUS_FEATURE_KEYS = [
  'cv_pro_formats',
  'search_for_me',
  'lammah_feed',
] as const satisfies readonly Model1FeatureKey[]

export type JidPlusFeatureKey = (typeof JID_PLUS_FEATURE_KEYS)[number]

/** B2B employer plans — gated via `company_has_entitlement`. */
export const EMPLOYER_FEATURE_KEYS = [
  'smart_communication',
  'ssis',
  'priority_visibility',
] as const satisfies readonly Model1FeatureKey[]

export type EmployerFeatureKey = (typeof EMPLOYER_FEATURE_KEYS)[number]

export function isModel1FeatureKey(value: string): value is Model1FeatureKey {
  return (MODEL1_FEATURE_KEYS as readonly string[]).includes(value)
}

export function isJidPlusFeatureKey(value: string): value is JidPlusFeatureKey {
  return (JID_PLUS_FEATURE_KEYS as readonly string[]).includes(value)
}

export function isEmployerFeatureKey(value: string): value is EmployerFeatureKey {
  return (EMPLOYER_FEATURE_KEYS as readonly string[]).includes(value)
}

export function assertJidPlusFeatureKey(key: Model1FeatureKey): asserts key is JidPlusFeatureKey {
  if (!isJidPlusFeatureKey(key)) {
    throw new Error(`Feature "${key}" is not a JID Plus (B2C) entitlement`)
  }
}
