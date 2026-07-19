import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LammahFeed } from '@/app/[locale]/(public)/opportunities/_components/lammah-feed'

const useEntitlementMock = vi.fn()
const useLammahFeedQueryMock = vi.fn()

vi.mock('@/lib/monetization/use-entitlement', () => ({
  useEntitlement: (...args: unknown[]) => useEntitlementMock(...args),
}))

vi.mock('@/lib/hooks/use-lammah-feed-query', () => ({
  useLammahFeedQuery: (...args: unknown[]) => useLammahFeedQueryMock(...args),
}))

describe('LammahFeed honesty boundary', () => {
  it('shows an honest unavailable state without fabricated preview records or metrics', () => {
    useEntitlementMock.mockReturnValue({
      enabled: false,
      quota: null,
      isLoading: false,
      isError: false,
      entitlements: [],
      refetch: vi.fn(),
    })

    render(<LammahFeed />)

    expect(screen.getByText('unavailableTitle')).toBeInTheDocument()
    expect(screen.getByText('unavailableDescription')).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText('teaserWeekly')).not.toBeInTheDocument()
    expect(useLammahFeedQueryMock).not.toHaveBeenCalled()
  })
})
