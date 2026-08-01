/**
 * Spec 08-B — unit tests for read-only owner-scoped dashboard counts.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  countOwnerApplicationsReceived,
  countOwnerJobsPosted,
} from '@/lib/queries/company-dashboard-metrics'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Chain = {
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
}

function makeClient(handlers: {
  jobs?: { count?: number | null; error?: { message: string } | null; data?: Array<{ id: string }> }
  applications?: { count?: number | null; error?: { message: string } | null }
}) {
  const from = vi.fn((table: string) => {
    const chain: Chain = {
      select: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
    }

    if (table === 'jobs') {
      chain.select.mockImplementation(() => {
        // head count path returns thenable via eq; list path returns thenable via eq too
        const eqResult = {
          then: undefined as unknown,
          eq: chain.eq,
        }
        chain.eq.mockImplementation(() => {
          const jobs = handlers.jobs ?? {}
          if (jobs.data) {
            return Promise.resolve({ data: jobs.data, error: jobs.error ?? null, count: null })
          }
          return Promise.resolve({
            data: null,
            error: jobs.error ?? null,
            count: jobs.count ?? 0,
          })
        })
        return eqResult
      })
    }

    if (table === 'applications') {
      chain.select.mockImplementation(() => {
        chain.in.mockImplementation(() =>
          Promise.resolve({
            data: null,
            error: handlers.applications?.error ?? null,
            count: handlers.applications?.count ?? 0,
          }),
        )
        return { in: chain.in }
      })
    }

    return chain
  })

  return { from } as unknown as SupabaseClient<Database>
}

describe('Spec 08-B — countOwnerJobsPosted', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ok zero when count is 0', async () => {
    const client = makeClient({ jobs: { count: 0 } })
    await expect(countOwnerJobsPosted(client, 'bp-1')).resolves.toEqual({
      status: 'ok',
      value: 0,
    })
  })

  it('returns ok positive count', async () => {
    const client = makeClient({ jobs: { count: 5 } })
    await expect(countOwnerJobsPosted(client, 'bp-1')).resolves.toEqual({
      status: 'ok',
      value: 5,
    })
  })

  it('returns error without coercing to 0', async () => {
    const client = makeClient({ jobs: { error: { message: 'denied' } } })
    await expect(countOwnerJobsPosted(client, 'bp-1')).resolves.toEqual({
      status: 'error',
      message: 'denied',
    })
  })
})

describe('Spec 08-B — countOwnerApplicationsReceived', () => {
  it('returns ok zero when owner has no jobs', async () => {
    const client = makeClient({ jobs: { data: [] } })
    await expect(countOwnerApplicationsReceived(client, 'bp-1')).resolves.toEqual({
      status: 'ok',
      value: 0,
    })
  })

  it('counts applications for owner job ids', async () => {
    const client = makeClient({
      jobs: { data: [{ id: 'j1' }, { id: 'j2' }] },
      applications: { count: 7 },
    })
    await expect(countOwnerApplicationsReceived(client, 'bp-1')).resolves.toEqual({
      status: 'ok',
      value: 7,
    })
  })

  it('returns error without coercing to 0', async () => {
    const client = makeClient({
      jobs: { data: [{ id: 'j1' }] },
      applications: { error: { message: 'rls' } },
    })
    await expect(countOwnerApplicationsReceived(client, 'bp-1')).resolves.toEqual({
      status: 'error',
      message: 'rls',
    })
  })
})
