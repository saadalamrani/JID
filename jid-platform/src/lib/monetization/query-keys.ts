export const ENTITLEMENTS_QUERY_KEY = ['entitlements', 'me'] as const

export const JID_PLUS_PLAN_QUERY_KEY = ['plans', 'jid_plus'] as const

export const USER_SUBSCRIPTION_QUERY_KEY = ['subscriptions', 'me', 'jid_plus'] as const

/** TanStack Query staleTime for entitlement bootstrap (Prompt 0). */
export const ENTITLEMENTS_STALE_MS = 5 * 60 * 1000
