export { assertJidPlusFeatureKey, isEmployerFeatureKey, isJidPlusFeatureKey, isModel1FeatureKey } from './feature-keys'
export {
  EMPLOYER_FEATURE_KEYS,
  JID_PLUS_FEATURE_KEYS,
  MODEL1_FEATURE_KEYS,
} from './feature-keys'
export type {
  EmployerFeatureKey,
  JidPlusFeatureKey,
  Model1FeatureKey,
} from './feature-keys'

export { fetchMyEntitlements } from './entitlements-client'
export { companyHasEntitlement, fetchMyEntitlementsServer, userHasEntitlement } from './entitlements-server'
export { useEntitlement, useEntitlements } from './use-entitlement'
export type { EntitlementState } from './use-entitlement'

export {
  ENTITLEMENTS_QUERY_KEY,
  ENTITLEMENTS_STALE_MS,
  JID_PLUS_PLAN_QUERY_KEY,
  USER_SUBSCRIPTION_QUERY_KEY,
} from './query-keys'

export { fetchJidPlusPlan } from './plans-client'
export { fetchMyJidPlusSubscription } from './subscriptions-client'

export {
  computeYearlySavingsPercent,
  formatSarAmount,
  priceForCycle,
} from './format'

export type {
  BillingCycle,
  JidPlusPlan,
  OpportunityTier,
  UserEntitlement,
  UserSubscription,
} from './types'
