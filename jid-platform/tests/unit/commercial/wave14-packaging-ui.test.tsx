import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import en from '../../../messages/en.json'
import { PackageCatalog } from '@/components/commercial/package-catalog'
import { PlusPlanCompare } from '@/components/monetization/plus-plan-compare'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => {
    const translate = (key: string) => {
      const parts = `${namespace}.${key}`.split('.')
      let cursor: unknown = en
      for (const part of parts) {
        cursor = (cursor as Record<string, unknown> | undefined)?.[part]
      }
      return typeof cursor === 'string' ? cursor : key
    }
    return Object.assign(translate, { raw: translate })
  },
}))

vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}))

describe('Wave 14 packaging UI', () => {
  it('renders employer packages without a published SAR amount', () => {
    render(<PackageCatalog actor="business" />)
    expect(screen.getByTestId('package-catalog-business')).toBeInTheDocument()
    expect(screen.getByTestId('package-card-employer_starter')).toHaveTextContent('Employer Starter')
    expect(screen.getByTestId('package-card-employer_growth')).toHaveTextContent('Price not adopted')
    expect(screen.queryByText(/SAR \d/)).toBeNull()
    expect(screen.queryByText(/ر\.س/)).toBeNull()
    expect(screen.queryByText('49.00')).toBeNull()
    expect(screen.queryByText('999')).toBeNull()
  })

  it('renders Plus compare without a catalog amount', () => {
    render(<PlusPlanCompare locale="en" />)
    expect(screen.getByTestId('plus-plan-compare')).toHaveTextContent('Price not adopted')
    expect(screen.queryByText(/SAR \d/)).toBeNull()
  })
})
