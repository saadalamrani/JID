import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ResponsiveRecordList } from '@/components/ui/responsive-record-list'

describe('ResponsiveRecordList', () => {
  it('renders a stacked list and a table caption without overflowing copy', () => {
    render(
      <div dir="rtl">
        <ResponsiveRecordList
          caption="Affiliations"
          columns={[
            { key: 'name', header: 'Name', render: (row) => row.name },
            { key: 'state', header: 'State', render: (row) => row.state },
          ]}
          rows={[{ name: 'جامعة', state: 'DECLARED' }]}
          getRowKey={(row) => row.name}
          empty={<p>Empty</p>}
        />
      </div>,
    )

    expect(screen.getAllByText('جامعة').length).toBeGreaterThan(0)
    expect(screen.getAllByText('DECLARED').length).toBeGreaterThan(0)
    expect(screen.getByRole('table', { name: 'Affiliations' })).toBeInTheDocument()
  })

  it('renders the empty slot when there are no rows', () => {
    render(
      <ResponsiveRecordList
        caption="Affiliations"
        columns={[{ key: 'name', header: 'Name', render: (row: { name: string }) => row.name }]}
        rows={[]}
        getRowKey={(row) => row.name}
        empty={<p>No affiliations</p>}
      />,
    )
    expect(screen.getByText('No affiliations')).toBeInTheDocument()
  })
})
