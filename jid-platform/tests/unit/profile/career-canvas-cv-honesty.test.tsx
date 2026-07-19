import { render, screen } from '@testing-library/react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import arMessages from '@/../messages/ar.json'
import enMessages from '@/../messages/en.json'
import { SectionFormPane } from '@/app/[locale]/(individual)/profile/cv/_components/section-form-pane'
import { CareerCanvasSummaryCard } from '@/components/profile/workspace/career-canvas-summary-card'
import { CvBuilderEntryCard } from '@/components/profile/workspace/cv-builder-entry-card'

vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('Career Canvas honest state', () => {
  it('renders a noninteractive unavailable state when there is no derived summary', async () => {
    const view = await CareerCanvasSummaryCard({
      canvas: { available: false, direction: null, aspiration: null, highlights: [] },
    })
    render(view)

    expect(screen.getByText('emptyUnavailable')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('labels derived profile data as a read-only summary', async () => {
    const view = await CareerCanvasSummaryCard({
      canvas: {
        available: false,
        direction: 'Product design',
        aspiration: 'Graduate program',
        highlights: ['Design systems'],
      },
    })
    render(view)

    expect(screen.getByText('Product design')).toBeInTheDocument()
    expect(screen.getByText('readOnlyNotice')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('CV honest state', () => {
  it('offers only the real builder entry action from the profile workspace', () => {
    render(<CvBuilderEntryCard visible />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/profile/cv')
    expect(screen.queryByText('exportCv')).not.toBeInTheDocument()
  })

  it('shows honest loading and unavailable states instead of a coming-soon editor', () => {
    const loading = render(
      <SectionFormPane section="header" cv={undefined} isLoading />,
    )
    expect(screen.getByText('loadingState')).toBeInTheDocument()
    loading.unmount()

    render(<SectionFormPane section="header" cv={undefined} isLoading={false} />)
    expect(screen.getByText('unavailableState')).toBeInTheDocument()
    expect(screen.queryByText('formPlaceholderTitle')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('keeps the updated Career Canvas and CV keys in Arabic and English parity', () => {
    expect(Object.keys(arMessages.profile.workspace.canvas).sort()).toEqual(
      Object.keys(enMessages.profile.workspace.canvas).sort(),
    )
    expect(Object.keys(arMessages.profile.workspace.cvBuilder).sort()).toEqual(
      Object.keys(enMessages.profile.workspace.cvBuilder).sort(),
    )
    expect(Object.keys(arMessages.cv.builder).sort()).toEqual(
      Object.keys(enMessages.cv.builder).sort(),
    )
    expect(enMessages.cv.builder).not.toHaveProperty('formPlaceholderTitle')
    expect(arMessages.cv.builder).not.toHaveProperty('formPlaceholderBody')
  })
})
