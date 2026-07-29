/**
 * Spec 05-B DEF-04 — University dashboard honesty (absent / present / error).
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

  it('no snapshot → EmptyUniversityState; export control absent', () => {
    useUniversityDashboard.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
    })

    render(<UniversityDashboard />)

    expect(screen.getByTestId('university-dashboard-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('university-dashboard-export')).not.toBeInTheDocument()
    expect(screen.queryByTestId('university-dashboard-snapshot')).not.toBeInTheDocument()
  })

  it('snapshot present with total_students 0 still shows real KPIs + export (not empty)', () => {
    useUniversityDashboard.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          university_id: 'u-1',
          total_students: 0,
          college_distribution: {},
          profile_completion_pct: 0,
          cv_creation_pct: 0,
          job_applications: 0,
          mentorship_sessions: 0,
          status_breakdown: {},
          refreshed_at: '2026-07-29T12:00:00.000Z',
        },
      ],
    })

    render(<UniversityDashboard />)

    expect(screen.getByTestId('university-dashboard-snapshot')).toBeInTheDocument()
    expect(screen.getByTestId('university-dashboard-export')).toBeInTheDocument()
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument()
    expect(screen.queryByTestId('university-dashboard-empty')).not.toBeInTheDocument()
  })

  it('snapshot present renders real refreshed_at and KPI values', () => {
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
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText(/Confirmed\/completed mentorship sessions: 11/)).toBeInTheDocument()
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument()
  })

  it('query error renders honest error state (not empty)', () => {
    useUniversityDashboard.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      error: new Error('fail'),
    })

    render(<UniversityDashboard />)

    expect(screen.getByTestId('university-dashboard-error')).toBeInTheDocument()
    expect(screen.queryByTestId('university-dashboard-empty')).not.toBeInTheDocument()
    expect(screen.queryByTestId('university-dashboard-export')).not.toBeInTheDocument()
  })

  it('EmptyUniversityState CTA points at university profile edit', () => {
    render(<EmptyUniversityState />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/university/profile/edit')
  })
})
