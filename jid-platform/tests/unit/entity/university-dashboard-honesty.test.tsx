/**
 * Spec 05-B DEF-04 — University dashboard honesty after Wave 10 foundation.
 * Unmapped owners fail closed. Mapped owners see aggregate foundation, never fake KPIs.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import en from '../../../messages/en.json'
import { UniversityDashboard } from '@/app/[locale]/(company)/_components/university-dashboard'
import { EmptyUniversityState } from '@/app/[locale]/(company)/_components/empty-university-state'
import type { UniversityOwnerFoundationSnapshot } from '@/types/contracts/university'

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

const unmapped: UniversityOwnerFoundationSnapshot = {
  mapping_present: false,
  fail_closed_reason: 'unmapped',
}

const mapped: UniversityOwnerFoundationSnapshot = {
  mapping_present: true,
  fail_closed_reason: null,
  mapping_id: 'map-1',
  directory_id: 'dir-1',
  catalog_university_id: 'cat-1',
  mapped_at: '2026-08-31T09:30:00.000Z',
  verified_affiliation_count: 2,
  cohorts: [
    {
      id: 'c-1',
      graduation_year: 2024,
      degree_level: 'bachelor',
      program_text: 'Computer Science',
      major_id: null,
      active_membership_count: 2,
    },
  ],
  outcome_counts: [{ source: 'USER_DECLARED', presence: 'UNKNOWN', category: 'UNKNOWN', count: 1 }],
  metrics: [
    {
      metric_key: 'verified_affiliation_count',
      name_ar: 'عدد الانتماءات الموثّقة',
      name_en: 'Verified affiliation count',
      source_definition: 'university_affiliations',
      population_definition: 'verified affiliations',
      window_definition: 'active',
      coverage_rule: 'VERIFIED only',
      missingness_rule: 'unknown stays unknown',
      privacy_rule: 'aggregate only',
      computability: 'COMPUTABLE',
      value: 2,
    },
    {
      metric_key: 'employment_rate',
      name_ar: 'معدل التوظيف',
      name_en: 'Employment rate',
      source_definition: 'not computable',
      population_definition: 'not defined',
      window_definition: 'not defined',
      coverage_rule: 'Wave 10 does not compute this metric',
      missingness_rule: 'never inferred as unemployed',
      privacy_rule: 'not displayed as a rate',
      computability: 'CONTRACT_ONLY',
      value: null,
    },
  ],
}

describe('Wave 10 University foundation honesty', () => {
  it('unmapped owner fails closed without KPI numbers', () => {
    render(<UniversityDashboard foundation={unmapped} />)
    expect(screen.getByTestId('university-dashboard-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('university-dashboard-foundation')).not.toBeInTheDocument()
    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })

  it('mapped owner shows aggregate foundation and hides employment rate', () => {
    render(<UniversityDashboard foundation={mapped} />)
    expect(screen.getByTestId('university-dashboard-foundation')).toBeInTheDocument()
    expect(screen.getByTestId('university-verified-count')).toHaveTextContent('2')
    expect(screen.getByTestId('metric-employment_rate')).toHaveTextContent('Not computable yet')
    expect(screen.queryByText(/employment rate %/i)).not.toBeInTheDocument()
  })

  it('EmptyUniversityState default CTA still points at university profile edit', () => {
    render(<EmptyUniversityState />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/university/profile/edit')
  })
})
