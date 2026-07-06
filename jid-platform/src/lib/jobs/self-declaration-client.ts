import type { DeclareApplicationResult, JobDeclarationStatus } from '@/types/self-declaration'

export async function fetchJobDeclarationStatus(jobId: string): Promise<JobDeclarationStatus> {
  const response = await fetch(`/api/jobs/${jobId}/declaration-status`, {
    credentials: 'include',
  })

  if (response.status === 401) {
    return { declared: false, primaryEmail: null }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Failed to load declaration status')
  }

  return response.json() as Promise<JobDeclarationStatus>
}

export async function logApplicationIntent(jobId: string): Promise<void> {
  const response = await fetch(`/api/jobs/${jobId}/intent`, {
    method: 'POST',
    credentials: 'include',
  })

  if (response.status === 401) {
    throw new Error('Authentication required')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Failed to log application intent')
  }
}

export async function declareApplication(jobId: string): Promise<DeclareApplicationResult> {
  const response = await fetch(`/api/jobs/${jobId}/declare`, {
    method: 'POST',
    credentials: 'include',
  })

  if (response.status === 401) {
    throw new Error('Authentication required')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Failed to declare application')
  }

  return response.json() as Promise<DeclareApplicationResult>
}
