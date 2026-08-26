import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SurfaceStateView } from '@/components/ui/surface-state'
import { missingNumberDisplay, SURFACE_STATES } from '@/lib/ui/surface-state'

describe('SurfaceStateView', () => {
  it('freezes the shared UI states without inventing domain enums', () => {
    expect(SURFACE_STATES).toEqual([
      'loading',
      'ready',
      'empty',
      'error',
      'forbidden',
      'unavailable',
      'stale',
    ])
  })

  it('does not coerce a missing number to zero', () => {
    expect(missingNumberDisplay(null)).toBeNull()
    expect(missingNumberDisplay(undefined)).toBeNull()
    expect(missingNumberDisplay(0)).toBe(0)
  })

  it('announces loading without placeholder metrics', () => {
    render(<SurfaceStateView state="loading" label="Loading records" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading records')).toHaveClass('sr-only')
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('renders empty, error retry, forbidden, unavailable, and stale as distinct copy', () => {
    const { rerender } = render(
      <SurfaceStateView state="empty" title="No records" description="Nothing to show yet" />,
    )
    expect(screen.getByRole('heading', { name: 'No records' })).toBeInTheDocument()

    rerender(
      <SurfaceStateView
        state="error"
        title="Could not load"
        message="Try again"
        onRetry={() => undefined}
        retryLabel="Retry"
      />,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()

    rerender(
      <SurfaceStateView
        state="forbidden"
        title="Not allowed"
        message="This record is not available to you"
      />,
    )
    expect(screen.getByText('This record is not available to you')).toBeInTheDocument()
    expect(screen.queryByText('hidden-secret')).not.toBeInTheDocument()

    rerender(
      <SurfaceStateView
        state="unavailable"
        title="Unavailable"
        message="This capability is not enabled"
      />,
    )
    expect(screen.getByText('This capability is not enabled')).toBeInTheDocument()

    rerender(
      <SurfaceStateView
        state="stale"
        title="Source is stale"
        message="Last confirmed earlier than the freshness window"
        asOfLabel="as of 2026-08-01"
      />,
    )
    expect(screen.getByText(/Source is stale/)).toBeInTheDocument()
    expect(screen.getByText(/as of 2026-08-01/)).toBeInTheDocument()
  })
})
