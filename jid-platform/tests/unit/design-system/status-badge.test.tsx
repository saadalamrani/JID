import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBadge, statusBadgeVariants } from '@/components/ui/status-badge'
import {
  FORBIDDEN_DECORATIVE_BADGE_LABELS,
  UNIVERSITY_AFFILIATION_STATUS_STATES,
  contractStatusVariant,
} from '@/lib/ui/contract-presentation'

describe('StatusBadge', () => {
  it('always renders visible text', () => {
    render(<StatusBadge>Active</StatusBadge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('supports semantic variants', () => {
    expect(statusBadgeVariants({ variant: 'neutral' })).toContain('bg-secondary')
    expect(statusBadgeVariants({ variant: 'success' })).toContain('text-success')
    expect(statusBadgeVariants({ variant: 'warning' })).toContain('text-warning')
    expect(statusBadgeVariants({ variant: 'destructive' })).toContain('text-destructive')
    expect(statusBadgeVariants({ variant: 'brand' })).toContain('bg-accent')
  })

  it('maps representative contract-backed affiliation states', () => {
    expect(UNIVERSITY_AFFILIATION_STATUS_STATES).toEqual(['DECLARED', 'VERIFIED', 'NEEDS_REVIEW'])
    expect(contractStatusVariant({ domain: 'universityAffiliation', state: 'DECLARED' })).toBe(
      'neutral',
    )
    expect(contractStatusVariant({ domain: 'universityAffiliation', state: 'VERIFIED' })).toBe(
      'success',
    )
    expect(contractStatusVariant({ domain: 'universityAffiliation', state: 'NEEDS_REVIEW' })).toBe(
      'warning',
    )

    render(
      <StatusBadge domain="universityAffiliation" state="VERIFIED">
        Verified
      </StatusBadge>,
    )
    const badge = screen.getByText('Verified')
    expect(badge.className).toContain('text-success')
    expect(badge.textContent).toBe('Verified')
  })

  it('maps opportunity lifecycle states from the frozen contract', () => {
    render(
      <StatusBadge domain="opportunityLifecycle" state="PUBLISHED">
        Published
      </StatusBadge>,
    )
    expect(screen.getByText('Published').className).toContain('text-success')
  })

  it('does not define decorative marketing badge domains', () => {
    expect(FORBIDDEN_DECORATIVE_BADGE_LABELS).toEqual(
      expect.arrayContaining([
        'AI',
        'Smart',
        'Hot',
        'Best Match',
        'Popular',
        'Trusted',
        'Trending',
      ]),
    )
    expect(statusBadgeVariants({ variant: 'neutral' })).not.toContain('hot')
  })

  it('avoids decorative pill geometry', () => {
    render(<StatusBadge variant="success">Verified</StatusBadge>)
    const badge = screen.getByText('Verified')
    expect(badge.className).toContain('rounded-md')
    expect(badge.className).not.toContain('rounded-full')
    expect(badge.className).toContain('tracking-normal')
  })

  it('accepts custom className without losing label', () => {
    render(
      <StatusBadge variant="warning" className="custom-class">
        Pending
      </StatusBadge>,
    )
    const badge = screen.getByText('Pending')
    expect(badge).toHaveClass('custom-class')
  })

  it('renders under RTL and LTR', () => {
    const { rerender } = render(
      <div dir="rtl">
        <StatusBadge>نشط</StatusBadge>
      </div>,
    )
    expect(screen.getByText('نشط')).toBeInTheDocument()

    rerender(
      <div dir="ltr">
        <StatusBadge>Active</StatusBadge>
      </div>,
    )
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})
