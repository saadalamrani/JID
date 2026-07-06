import type { JobFilters, JobsListResult } from '@/types/job'
import { buildJobSearchParams } from '@/types/job'

export async function fetchJobsClient(filters: JobFilters): Promise<JobsListResult> {
  const params = buildJobSearchParams(filters)
  const response = await fetch(`/api/jobs?${params.toString()}`)

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Jobs fetch failed')
  }

  return response.json() as Promise<JobsListResult>
}

export function jobsQueryKey(filters: Omit<JobFilters, 'page' | 'limit'>) {
  return ['jobs', 'list', filters] as const
}
