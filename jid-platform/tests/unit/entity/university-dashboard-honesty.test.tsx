/**
 * Spec 05-B DEF-04 — University dashboard honesty after Wave 10 foundation.
 * Unmapped owners fail closed. Mapped owners see aggregate foundation, never fake KPIs.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import en from '../../../messages/en.json'
import { UniversityDashboard } from '@/app/[locale]/(company)/_components/university-dashboard'
import { EmptyUniversityState } from '@/app/[locale]/(company)/_components/empty-university-state'
import type { UniversityIntelligenceSnapshot } from '@/types/contracts/university'

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }))

vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string, values?: { count?: number }) => {
    const parts = `${namespace}.${key}`.split('.')
    let cursor: unknown = en
    for (const part of parts) {
      cursor = (cursor as Record<string, unknown> | undefined)?.[part]
    }
    if (typeof cursor === 'string') {
      if (values?.count !== undefined) {
        return cursor.replace('{count}', String(values.count))
      }
      return cursor
    }
    return key
  },
}))

const unmapped: UniversityIntelligenceSnapshot = {
  mapping_present: false,
  fail_closed_reason: 'unmapped',
}

const mapped: UniversityIntelligenceSnapshot = {
  mapping_present: true,
  fail_closed_reason: null,
  catalog_university_id: 'cat-1',
  eligible_population: 10,
  known_outcome_count: 2,
  known_outcome_coverage: 0.2,
  suppression_threshold: 5,
  suppressed: false,
  cohorts: [
    {
      id: 'c-1',
      graduation_year: 2024,
      degree_level: 'bachelor',
      program_text: 'Computer Science',
      major_id: null,
      active_membership_count: 10,
    },
  ],
  outcome_distribution: [],
}

describe('Wave 10 University foundation honesty', () => {
  it('unmapped owner fails closed without KPI numbers', () => {
    render(<UniversityDashboard foundation={unmapped} />)
    expect(screen.getByTestId('university-dashboard-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('university-intelligence')).not.toBeInTheDocument()
    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })

  it('mapped owner shows aggregate coverage without presenting an employment rate', () => {
    render(<UniversityDashboard foundation={mapped} />)
    expect(screen.getByTestId('university-intelligence')).toBeInTheDocument()
    expect(screen.getByTestId('known-outcome-coverage')).toHaveTextContent('20%')
    expect(screen.getByTestId('known-outcome-coverage')).toHaveTextContent(
      'It is not an employment rate',
    )
    expect(screen.queryByText(/employment rate %/i)).not.toBeInTheDocument()
  })

  it('EmptyUniversityState default CTA still points at university profile edit', () => {
    render(<EmptyUniversityState />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/university/profile/edit')
  })
})
