import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTranslations } from 'next-intl'
import arMessages from '@/../messages/ar.json'
import enMessages from '@/../messages/en.json'
import { CatalogResultsSection } from '@/app/[locale]/(public)/catalog/_components/catalog-page-client'
import { CatalogEmptyState } from '@/app/[locale]/(public)/catalog/_components/empty-state'
import { RealtimeSearchInput } from '@/app/[locale]/(public)/catalog/_components/realtime-search-input'

const catalogState = vi.hoisted(() => ({
  filters: { q: 'JID' },
  resultCount: 1234,
  isFetching: false,
  setSearch: vi.fn(),
  clearSearch: vi.fn(),
  resetFilters: vi.fn(),
  companies: [],
  isLoading: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  fetchNextPage: vi.fn(),
  hasActiveFilters: false,
  error: null as Error | null,
  isHydrated: true,
}))

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
}))

vi.mock('@/app/[locale]/(public)/catalog/_components/catalog-filter-context', () => ({
  useCatalogFilters: () => catalogState,
}))

type SearchMessages = typeof enMessages.catalogPage.search

function useLocaleMessages(messages: SearchMessages) {
  vi.mocked(useTranslations).mockReturnValue(
    ((key: keyof SearchMessages, values?: Record<string, string>) => {
      let message = messages[key]
      for (const [name, value] of Object.entries(values ?? {})) {
        message = message.replace(`{${name}}`, value)
      }
      return message
    }) as ReturnType<typeof useTranslations>,
  )
}

describe('RealtimeSearchInput i18n', () => {
  beforeEach(() => {
    catalogState.filters.q = 'JID'
    catalogState.resultCount = 1234
    catalogState.isFetching = false
    catalogState.setSearch.mockReset()
    catalogState.clearSearch.mockReset()
    catalogState.resetFilters.mockReset()
    catalogState.error = null
  })

  it('renders English search copy, Latin digits, and accessible keyboard guidance', () => {
    useLocaleMessages(enMessages.catalogPage.search)
    render(<RealtimeSearchInput />)

    const input = screen.getByRole('searchbox', {
      name: enMessages.catalogPage.search.inputLabel,
    })
    expect(input).toHaveAttribute('placeholder', enMessages.catalogPage.search.placeholder)
    expect(input).toHaveAccessibleDescription(
      enMessages.catalogPage.search.keyboardInstructions,
    )
    expect(screen.getByText('1,234 results')).toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(catalogState.clearSearch).toHaveBeenCalledOnce()
  })

  it('renders Arabic parity and localizes the loading state', () => {
    catalogState.isFetching = true
    useLocaleMessages(arMessages.catalogPage.search)
    render(<RealtimeSearchInput />)

    expect(
      screen.getByRole('searchbox', { name: arMessages.catalogPage.search.inputLabel }),
    ).toHaveAttribute('placeholder', arMessages.catalogPage.search.placeholder)
    expect(screen.getByText(arMessages.catalogPage.search.loading)).toBeInTheDocument()
  })

  it('keeps every search key in Arabic and English', () => {
    expect(Object.keys(arMessages.catalogPage.search).sort()).toEqual(
      Object.keys(enMessages.catalogPage.search).sort(),
    )
  })

  it('renders localized English empty and error states', () => {
    useLocaleMessages(enMessages.catalogPage.search)
    const emptyView = render(<CatalogEmptyState />)

    expect(screen.getByText(enMessages.catalogPage.search.emptyTitle)).toBeInTheDocument()
    expect(screen.getByText(enMessages.catalogPage.search.resetFilters)).toBeInTheDocument()
    emptyView.unmount()

    catalogState.error = new Error('offline')
    render(<CatalogResultsSection />)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load results: offline')
  })
})
