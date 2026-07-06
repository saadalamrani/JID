'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJobsClient, jobsQueryKey } from '@/lib/jobs/client'
import type { JobFilters, JobsListResult } from '@/types/job'
import { DEFAULT_JOB_FILTERS } from '@/types/job'

type UseJobsQueryOptions = {
  initialData?: JobsListResult
  enabled?: boolean
}

export function useJobsQuery(
  filters: Omit<JobFilters, 'page' | 'limit'>,
  options: UseJobsQueryOptions = {},
) {
  const { enabled = true, initialData } = options

  return useQuery({
    queryKey: jobsQueryKey(filters),
    enabled,
    queryFn: () =>
      fetchJobsClient({
        ...filters,
        page: DEFAULT_JOB_FILTERS.page,
        limit: DEFAULT_JOB_FILTERS.limit,
      }),
    initialData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
