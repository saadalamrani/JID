import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBadge, statusBadgeVariants } from '@/components/ui/status-badge'

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

  it('avoids decorative pill geometry', () => {
    render(<StatusBadge variant="success">Verified</StatusBadge>)
    const badge = screen.getByText('Verified')
    expect(badge.className).toContain('rounded-md')
    expect(badge.className).not.toContain('rounded-full')
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
