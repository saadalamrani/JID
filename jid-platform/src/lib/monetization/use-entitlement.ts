'use client'

import { useQuery } from '@tanstack/react-query'
import type { Model1FeatureKey } from './feature-keys'
import { fetchMyEntitlements } from './entitlements-client'
import { ENTITLEMENTS_QUERY_KEY, ENTITLEMENTS_STALE_MS } from './query-keys'
import type { UserEntitlement } from './types'

export function useEntitlements() {
  return useQuery({
    queryKey: ENTITLEMENTS_QUERY_KEY,
    queryFn: fetchMyEntitlements,
    staleTime: ENTITLEMENTS_STALE_MS,
    refetchOnWindowFocus: false,
  })
}

export type EntitlementState = {
  enabled: boolean
  quota: number | null
  isLoading: boolean
  isError: boolean
  entitlements: UserEntitlement[]
  refetch: () => void
}

export function useEntitlement(feature: Model1FeatureKey): EntitlementState {
  const query = useEntitlements()
  const match = query.data?.find((row) => row.featureKey === feature)

  return {
    enabled: Boolean(match),
    quota: match?.quota ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    entitlements: query.data ?? [],
    refetch: () => {
      void query.refetch()
    },
  }
}
