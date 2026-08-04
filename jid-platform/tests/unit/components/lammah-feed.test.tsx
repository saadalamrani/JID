import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LammahFeed } from '@/app/[locale]/(public)/opportunities/_components/lammah-feed'

describe('LammahFeed honesty boundary', () => {
  it('shows an honest unavailable state without fabricated preview records or metrics', () => {
    render(
      <LammahFeed
        initialState={{ entitled: false, available: false, data: { items: [], count: 0 } }}
      />,
    )

    expect(screen.getByText('unavailableTitle')).toBeInTheDocument()
    expect(screen.getByText('unavailableDescription')).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText('teaserWeekly')).not.toBeInTheDocument()
  })
})
