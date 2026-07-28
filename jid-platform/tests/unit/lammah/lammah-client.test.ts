import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchLammahFeedClient } from '@/lib/lammah/client'

const queryResult = {
  data: [],
  error: null,
  count: 0,
}

const queryBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  gt: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  in: vi.fn(),
  then: (resolve: (value: typeof queryResult) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(queryResult).then(resolve, reject),
}

for (const method of ['select', 'eq', 'gt', 'order', 'limit', 'in'] as const) {
  queryBuilder[method].mockReturnValue(queryBuilder)
}

const fromMock = vi.fn(() => queryBuilder)
const rpcMock = vi.fn(() => Promise.resolve({ data: 0, error: null }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: fromMock,
    rpc: rpcMock,
  }),
}))

describe('Lammah feed query boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters active, unexpired rows and all selected opportunity families at the server', async () => {
    await fetchLammahFeedClient({
      experienceChips: [],
      ownership: [],
      regions: [],
      sectors: [],
      opportunityTypes: ['job', 'co_op', 'internship', 'fellowship', 'scholarship'],
    })

    expect(fromMock).toHaveBeenCalledWith('lammah_opportunities')
    expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'active')
    expect(queryBuilder.gt).toHaveBeenCalledWith('expires_at', expect.any(String))
    expect(queryBuilder.in).toHaveBeenCalledWith('opportunity_type', [
      'job',
      'co_op',
      'internship',
      'fellowship',
      'scholarship',
    ])
  })

  it('uses the common classified inventory without user-specific feed predicates', async () => {
    await fetchLammahFeedClient({
      experienceChips: [],
      ownership: [],
      regions: [],
      sectors: [],
      opportunityTypes: [],
    })

    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(queryBuilder.eq).toHaveBeenCalledTimes(1)
    expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'active')
  })
})
