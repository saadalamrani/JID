/**
 * REFERENCE PATTERN — Component tests (P-003)
 *
 * Copy this structure for future presentational/interactive components:
 * - Import from @testing-library/react
 * - Assert visible text and aria-labels (accessibility contract)
 * - Assert variant/prop behavior without snapshot churn
 * - Keep mocks in tests/setup.ts (next/navigation, next-intl)
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TierBadge } from '@/components/monetization/tier-badge'

describe('TierBadge (reference component test)', () => {
  it('renders without crashing', () => {
    const { container } = render(<TierBadge tier="normal" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders normal tier label and aria-label', () => {
    render(<TierBadge tier="normal" />)
    expect(screen.getByText('عادي')).toBeInTheDocument()
    expect(screen.getByLabelText('عادي')).toBeInTheDocument()
  })

  it('renders plus tier label and aria-label', () => {
    render(<TierBadge tier="plus" />)
    expect(screen.getByText('بلس')).toBeInTheDocument()
    expect(screen.getByLabelText('بلس')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<TierBadge tier="plus" className="custom-class" />)
    expect(screen.getByLabelText('بلس')).toHaveClass('custom-class')
  })
})
