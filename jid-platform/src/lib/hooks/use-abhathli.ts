'use client'

import { useQuery } from '@tanstack/react-query'
import {
  abhathliMandatesQueryKey,
  abhathliMatchesQueryKey,
  fetchAbhathliUnseenCountClient,
  fetchMandateMatchesClient,
  fetchSearchMandatesClient,
} from '@/lib/abhathli/client'

export function useSearchMandates(enabled = true) {
  return useQuery({
    queryKey: abhathliMandatesQueryKey(),
    queryFn: fetchSearchMandatesClient,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useMandateMatches(enabled = true) {
  return useQuery({
    queryKey: abhathliMatchesQueryKey(),
    queryFn: () => fetchMandateMatchesClient(),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

export function useAbhathliUnseenCount(enabled = true) {
  return useQuery({
    queryKey: ['abhathli', 'unseen-count'],
    queryFn: fetchAbhathliUnseenCountClient,
    enabled,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  })
}
