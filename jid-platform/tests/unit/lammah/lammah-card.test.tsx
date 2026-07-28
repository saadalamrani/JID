import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LammahCard } from '@/app/[locale]/(public)/opportunities/_components/lammah-card'
import type { LammahOpportunityCard } from '@/types/lammah'

vi.mock('@/hooks/use-catalog-metadata', () => ({
  useCatalogRegions: () => ({ data: [] }),
  useCatalogSectors: () => ({ data: [] }),
}))

const item: LammahOpportunityCard = {
  id: '11111111-1111-4111-8111-111111111111',
  sourceId: '22222222-2222-4222-8222-222222222222',
  sourceName: 'Official source',
  companyId: null,
  companyNameRaw: 'External organization',
  titleAr: 'منحة بحثية',
  titleEn: 'Research scholarship',
  excerpt: null,
  sector: 'education',
  region: 'riyadh',
  ownershipType: null,
  experienceLevel: null,
  opportunityType: 'scholarship',
  externalUrl: 'https://official.example.test/opportunities/scholarship-1',
  sourcePublishedAt: '2026-07-25T00:00:00.000Z',
  scrapedAt: '2026-07-25T00:00:00.000Z',
  expiresAt: '2099-07-25T00:00:00.000Z',
  status: 'active',
  extractionConfidence: 1,
  companyLogoUrl: null,
}

describe('Lammah external action isolation', () => {
  it('hands off to the official external source without a native application action', () => {
    render(<LammahCard item={item} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', item.externalUrl)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
