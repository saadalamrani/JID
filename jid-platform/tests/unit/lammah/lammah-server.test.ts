import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchLammahPageState } from '@/lib/lammah/server'

const entitlementMock = vi.fn()
const createClientMock = vi.fn()
const result = { data: [], error: null, count: 0 }
const query = {
  select: vi.fn(),
  eq: vi.fn(),
  or: vi.fn(),
  gt: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  then: (resolve: (value: typeof result) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject),
}

for (const method of ['select', 'eq', 'or', 'gt', 'order', 'limit'] as const) {
  query[method].mockReturnValue(query)
}

vi.mock('@/lib/monetization', () => ({
  userHasEntitlement: (...args: unknown[]) => entitlementMock(...args),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}))

describe('Lammah server entitlement boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createClientMock.mockResolvedValue({ from: vi.fn(() => query) })
  })

  it('returns zero protected rows and never constructs the inventory query when unentitled', async () => {
    entitlementMock.mockResolvedValue(false)
    const state = await fetchLammahPageState()
    expect(state).toEqual({ entitled: false, available: true, data: { items: [], count: 0 } })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it('queries only active unexpired inventory for an entitled session', async () => {
    entitlementMock.mockResolvedValue(true)
    const state = await fetchLammahPageState()
    expect(state).toEqual({ entitled: true, available: true, data: { items: [], count: 0 } })
    expect(query.eq).toHaveBeenCalledWith('status', 'active')
    expect(query.or).toHaveBeenCalledWith(expect.stringContaining('expires_at.is.null'))
    expect(query.gt).toHaveBeenCalledWith('last_confirmed_at',expect.any(String))
    expect(query.limit).toHaveBeenCalledWith(120)
  })

  it('keeps published inventory independent from ingestion kill switches', async () => {
    entitlementMock.mockResolvedValue(true)
    const state = await fetchLammahPageState()
    expect(state.available).toBe(true)
    expect(createClientMock).toHaveBeenCalledTimes(1)
  })
})
