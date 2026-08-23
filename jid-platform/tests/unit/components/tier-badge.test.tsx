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

  // TierBadge now goes through useTranslations('monetization.tier') instead of
  // hardcoding Arabic text regardless of locale (that hardcoding was itself the
  // bug: en.json's own monetization.tier keys held Arabic text mislabeled as
  // English, confirmed live on the CV Builder format picker in an EN-locale
  // page). Per the global next-intl mock (tests/setup.ts: `key => key`),
  // asserting on the translation key is the correct reference-pattern here.
  it('renders normal tier label and aria-label', () => {
    render(<TierBadge tier="normal" />)
    expect(screen.getByText('normal')).toBeInTheDocument()
    expect(screen.getByLabelText('normal')).toBeInTheDocument()
  })

  it('renders plus tier label and aria-label', () => {
    render(<TierBadge tier="plus" />)
    expect(screen.getByText('plus')).toBeInTheDocument()
    expect(screen.getByLabelText('plus')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<TierBadge tier="plus" className="custom-class" />)
    expect(screen.getByLabelText('plus')).toHaveClass('custom-class')
  })
})
