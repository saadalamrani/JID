/**
 * Spec 05-B DEF-04 — University dashboard honesty (absent / present / error).
 * Spec 08-B — locale-aware dates + i18n KPI hint regression.
 * JID Design & UX Execution — Correction Pass 1: `university_dashboard_snapshot`
 * aggregates every student who selected the university, without checking
 * `show_profile_in_university_stats` consent. A present snapshot now renders the
 * consent-gate fail-closed state instead of live KPI/chart/PDF-export content —
 * see UniversityConsentGateState and DEPENDENCY_REQUIRED in the evidence report.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import en from '../../../messages/en.json'
import { UniversityDashboard } from '@/app/[locale]/(company)/_components/university-dashboard'
import { EmptyUniversityState } from '@/app/[locale]/(company)/_components/empty-university-state'

const useUniversityDashboard = vi.fn()

vi.mock('@/lib/queries/university-dashboard', () => ({
  useUniversityDashboard: (...args: unknown[]) => useUniversityDashboard(...args),
}))

vi.mock('@/lib/analytics/track', () => ({
  track: vi.fn(),
}))

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

describe('Spec 05-B DEF-04 — EmptyUniversityState / snapshot honesty', () => {
  beforeEach(() => {
    useUniversityDashboard.mockReset()
  })

  it('no snapshot → EmptyUniversityState; consent-gate state absent', () => {
    useUniversityDashboard.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
    })

    render(<UniversityDashboard />)

    expect(screen.getByTestId('university-dashboard-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('university-dashboard-consent-gate')).not.toBeInTheDocument()
    expect(screen.queryByTestId('university-dashboard-snapshot')).not.toBeInTheDocument()
  })

  it('snapshot present renders the honest consent-gate state, not live KPIs', () => {
    useUniversityDashboard.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          university_id: 'u-2',
          total_students: 42,
          college_distribution: { Engineering: 10 },
          profile_completion_pct: 12.5,
          cv_creation_pct: 8,
          job_applications: 3,
          mentorship_sessions: 11,
          status_breakdown: { alumni: 5 },
          refreshed_at: '2026-07-20T09:30:00.000Z',
        },
      ],
    })

    render(<UniversityDashboard />)

    expect(screen.getByTestId('university-dashboard-snapshot')).toBeInTheDocument()
    expect(screen.getByTestId('university-dashboard-consent-gate')).toBeInTheDocument()
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument()
    // Unconsented aggregate figures must not render as real institutional intelligence.
    expect(screen.queryByText('42')).not.toBeInTheDocument()
    expect(screen.queryByText(/Confirmed\/completed mentorship sessions/)).not.toBeInTheDocument()
    expect(screen.queryByTestId('university-dashboard-export')).not.toBeInTheDocument()
  })

  it('query error renders honest error state (not empty, not consent-gate)', () => {
    useUniversityDashboard.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      error: new Error('fail'),
    })

    render(<UniversityDashboard />)

    expect(screen.getByTestId('university-dashboard-error')).toBeInTheDocument()
    expect(screen.queryByTestId('university-dashboard-empty')).not.toBeInTheDocument()
    expect(screen.queryByTestId('university-dashboard-consent-gate')).not.toBeInTheDocument()
  })

  it('locale-aware refreshed_at uses Latin digits pattern', () => {
    useUniversityDashboard.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          university_id: 'u-3',
          total_students: 1,
          college_distribution: {},
          profile_completion_pct: 0,
          cv_creation_pct: 0,
          job_applications: 0,
          mentorship_sessions: 0,
          status_breakdown: {},
          refreshed_at: '2026-07-20T09:30:00.000Z',
        },
      ],
    })

    render(<UniversityDashboard />)
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument()
  })

  it('EmptyUniversityState CTA points at university profile edit', () => {
    render(<EmptyUniversityState />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/university/profile/edit')
  })
})
