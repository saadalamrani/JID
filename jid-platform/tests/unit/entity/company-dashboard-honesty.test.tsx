/**
 * Spec 08-B — Business dashboard honesty: real owner-scoped metrics, no placeholders.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import en from '../../../messages/en.json'
import ar from '../../../messages/ar.json'
import { CompanyDashboard } from '@/app/[locale]/(company)/_components/company-dashboard'
import type { OwnerBusinessProfile } from '@/lib/profile/owner-business-profile'

vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace: string) => {
    return (key: string, values?: { count?: number; defaultValue?: string }) => {
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
      return values?.defaultValue ?? key
    }
  },
}))

vi.mock('@/app/[locale]/(public)/catalog/_components/company-logo', () => ({
  CompanyLogo: () => <div data-testid="company-logo" />,
}))

const profile: OwnerBusinessProfile = {
  id: 'bp-1',
  directory_id: 'dir-1',
  owner_user_id: 'user-1',
  status: 'published',
  display_name_ar: 'منشأة تجريبية',
  display_name_en: 'Synth Co',
  tagline_ar: null,
  about_ar: 'نبذة',
  about_en: null,
  published_at: '2026-08-01T00:00:00.000Z',
  directory_logo_url: null,
} as OwnerBusinessProfile

describe('Spec 08-B — Business dashboard honesty', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('removes placeholderMetrics from messages and component source', () => {
    expect(en.company.dashboard).not.toHaveProperty('placeholderMetrics')
    expect(ar.company.dashboard).not.toHaveProperty('placeholderMetrics')

    const source = readFileSync(
      join(process.cwd(), 'src/app/[locale]/(company)/_components/company-dashboard.tsx'),
      'utf8',
    )
    expect(source).not.toContain('placeholderMetrics')
  })

  it('renders successful positive jobs and applications counts from owner-scoped results', async () => {
    const ui = await CompanyDashboard({
      profile,
      metrics: {
        jobsPosted: { status: 'ok', value: 3 },
        applicationsReceived: { status: 'ok', value: 12 },
      },
    })
    render(ui)

    expect(screen.getByTestId('company-metric-jobs-posted')).toHaveAttribute('data-metric-value', '3')
    expect(screen.getByTestId('company-metric-applications-received')).toHaveAttribute(
      'data-metric-value',
      '12',
    )
    expect(screen.queryByText(/future update/i)).not.toBeInTheDocument()
  })

  it('renders legitimate zero as 0 (not unavailable)', async () => {
    const ui = await CompanyDashboard({
      profile,
      metrics: {
        jobsPosted: { status: 'ok', value: 0 },
        applicationsReceived: { status: 'ok', value: 0 },
      },
    })
    render(ui)

    expect(screen.getByTestId('company-metric-jobs-posted')).toHaveAttribute('data-metric-value', '0')
    expect(screen.getByTestId('company-metric-applications-received')).toHaveAttribute(
      'data-metric-value',
      '0',
    )
    expect(screen.getByTestId('company-metric-jobs-posted')).toHaveAttribute('data-metric-state', 'ok')
  })

  it('renders query error distinctly and never as 0', async () => {
    const ui = await CompanyDashboard({
      profile,
      metrics: {
        jobsPosted: { status: 'error', message: 'boom' },
        applicationsReceived: { status: 'ok', value: 2 },
      },
    })
    render(ui)

    const jobs = screen.getByTestId('company-metric-jobs-posted')
    expect(jobs).toHaveAttribute('data-metric-state', 'error')
    expect(jobs).not.toHaveAttribute('data-metric-value')
    expect(jobs).toHaveTextContent(/could not be loaded/i)
    expect(screen.getByTestId('company-metric-applications-received')).toHaveAttribute(
      'data-metric-value',
      '2',
    )
  })

  it('keeps profile status chrome (classification A) with text label', async () => {
    const ui = await CompanyDashboard({
      profile,
      metrics: {
        jobsPosted: { status: 'ok', value: 1 },
        applicationsReceived: { status: 'ok', value: 1 },
      },
    })
    render(ui)
    expect(screen.getByTestId('company-dashboard-status')).toHaveTextContent('Published')
  })

  it('AR/EN metric keys stay in parity', () => {
    const enMetrics = en.company.dashboard.metrics
    const arMetrics = ar.company.dashboard.metrics
    expect(Object.keys(enMetrics).sort()).toEqual(Object.keys(arMetrics).sort())
    expect(en.university.dashboard.kpiHint).toBeTruthy()
    expect(ar.university.dashboard.kpiHint).toBeTruthy()
    expect(Object.keys(en.university.dashboard.statusBars.labels).sort()).toEqual(
      Object.keys(ar.university.dashboard.statusBars.labels).sort(),
    )
  })
})

describe('Spec 08-B — company dashboard metric helpers (source contracts)', () => {
  it('helpers scope by business_profile_id and never mention claimed_by', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/queries/company-dashboard-metrics.ts'),
      'utf8',
    )
    expect(source).toContain("eq('business_profile_id', businessProfileId)")
    expect(source).not.toMatch(/\.eq\(\s*['"]claimed_by['"]/)
    expect(source).not.toMatch(/from\(\s*['"]companies['"]\s*\)/)
    expect(source).toContain("from('jobs')")
    expect(source).toContain("from('applications')")
    expect(source).toContain("count: 'exact'")
    expect(source).toContain('head: true')
  })

  it('dashboard page wires fetchCompanyDashboardMetrics with owned profile id', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/[locale]/(company)/company/dashboard/page.tsx'),
      'utf8',
    )
    expect(source).toContain('fetchCompanyDashboardMetrics')
    expect(source).toContain('businessProfile.id')
    expect(source).not.toContain('placeholderMetrics')
  })
})
