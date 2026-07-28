import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LammahOpportunityTypeChips } from '@/app/[locale]/(public)/opportunities/_components/lammah-opportunity-type-chips'
import ar from '../../../messages/ar.json'
import en from '../../../messages/en.json'

describe('Lammah opportunity-family filter', () => {
  it('offers all five supported classified families', () => {
    render(<LammahOpportunityTypeChips selected={[]} onChange={vi.fn()} />)

    for (const key of ['job', 'co_op', 'internship', 'fellowship', 'scholarship']) {
      expect(screen.getByRole('button', { name: key })).toBeInTheDocument()
    }
  })

  it('returns the selected family without changing native-job filters', () => {
    const onChange = vi.fn()
    render(<LammahOpportunityTypeChips selected={[]} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'scholarship' }))

    expect(onChange).toHaveBeenCalledWith(['scholarship'])
  })

  it('keeps Arabic and English copy keys in parity', () => {
    const arKeys = Object.keys(ar.opportunities.lammah.opportunityTypes).sort()
    const enKeys = Object.keys(en.opportunities.lammah.opportunityTypes).sort()

    expect(arKeys).toEqual(enKeys)
  })
})
