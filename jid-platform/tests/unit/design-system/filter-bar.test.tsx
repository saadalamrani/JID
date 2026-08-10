import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FilterBar } from '@/components/ui/filter-bar'

describe('FilterBar', () => {
  it('exposes search landmark with required aria-label', () => {
    render(
      <FilterBar aria-label="Filters" search={<input aria-label="Search" />} />,
    )
    expect(screen.getByRole('search', { name: 'Filters' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument()
  })

  it('composes search, filters, and actions slots', () => {
    render(
      <FilterBar
        aria-label="Opportunity filters"
        search={<input aria-label="Query" />}
        filters={<button type="button">City</button>}
        actions={<button type="button">Clear</button>}
      />,
    )
    expect(screen.getByRole('textbox', { name: 'Query' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'City' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
  })

  it('uses responsive class contract for mobile stacking', () => {
    const { container } = render(
      <FilterBar aria-label="Filters" search={<span>search</span>} />,
    )
    const row = container.querySelector('[role="search"] > div')
    expect(row?.className).toContain('flex-col')
    expect(row?.className).toContain('md:flex-row')
  })

  it('does not hard-code domain copy or catalog i18n keys', () => {
    render(
      <FilterBar aria-label="Custom filters">
        <div>Extra row</div>
      </FilterBar>,
    )
    expect(screen.getByText('Extra row')).toBeInTheDocument()
    expect(screen.queryByText('filtersLabel')).not.toBeInTheDocument()
  })

  it('works in RTL and LTR', () => {
    const { rerender } = render(
      <div dir="rtl">
        <FilterBar aria-label="مرشحات" actions={<button type="button">مسح</button>} />
      </div>,
    )
    expect(screen.getByRole('search', { name: 'مرشحات' })).toBeInTheDocument()

    rerender(
      <div dir="ltr">
        <FilterBar aria-label="Filters" actions={<button type="button">Clear</button>} />
      </div>,
    )
    expect(screen.getByRole('search', { name: 'Filters' })).toBeInTheDocument()
  })
})
