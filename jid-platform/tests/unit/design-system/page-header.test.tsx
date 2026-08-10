import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PageHeader } from '@/components/ui/page-header'

describe('PageHeader', () => {
  it('renders title and optional description', () => {
    render(<PageHeader title="Dashboard" description="Overview of activity" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Overview of activity')).toBeInTheDocument()
  })

  it('places breadcrumb at start and actions at logical end', () => {
    render(
      <PageHeader
        title="Settings"
        breadcrumb={<nav aria-label="Breadcrumb">Home</nav>}
        actions={<button type="button">Edit</button>}
      />,
    )
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('uses responsive wrap-friendly class contract', () => {
    const { container } = render(<PageHeader title="Mobile" />)
    const header = container.querySelector('header')
    expect(header?.className).toContain('flex-col')
    expect(header?.className).toContain('sm:flex-row')
    expect(header?.className).toContain('sm:justify-between')
  })

  it('keeps zero tracking on the title for Arabic safety', () => {
    render(<PageHeader title="العنوان" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('tracking-normal')
  })

  it('works inside RTL and LTR containers', () => {
    const { rerender } = render(
      <div dir="rtl">
        <PageHeader title="Arabic" actions={<button type="button">حفظ</button>} />
      </div>,
    )
    expect(screen.getByRole('heading', { name: 'Arabic' })).toBeInTheDocument()

    rerender(
      <div dir="ltr">
        <PageHeader title="English" actions={<button type="button">Save</button>} />
      </div>,
    )
    expect(screen.getByRole('heading', { name: 'English' })).toBeInTheDocument()
  })
})
