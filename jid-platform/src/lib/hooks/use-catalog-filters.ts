'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_CATALOG_FILTER_STATE,
  OWNERSHIP_TYPES,
  type CatalogFilterState,
  type OwnershipType,
} from '@/types/catalog'

export const CATALOG_FILTERS_STORAGE_KEY = 'jid-catalog-filters'

const PERSIST_DEBOUNCE_MS = 500

function isOwnershipType(value: unknown): value is OwnershipType {
  return typeof value === 'string' && (OWNERSHIP_TYPES as readonly string[]).includes(value)
}

function isSortValue(value: unknown): value is CatalogFilterState['sort'] {
  return value === 'alphabetical_en' || value === 'manual_order'
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
}

function parseStoredFilters(raw: string | null): CatalogFilterState | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<CatalogFilterState>
    if (!parsed || typeof parsed !== 'object') return null

    return {
      q: typeof parsed.q === 'string' ? parsed.q : '',
      ownership: parseStringArray(parsed.ownership).filter(isOwnershipType),
      regions: parseStringArray(parsed.regions),
      sectors: parseStringArray(parsed.sectors),
      sort: isSortValue(parsed.sort) ? parsed.sort : DEFAULT_CATALOG_FILTER_STATE.sort,
    }
  } catch {
    return null
  }
}

export function useCatalogFiltersPersistence() {
  const [filters, setFilters] = useState<CatalogFilterState>(DEFAULT_CATALOG_FILTER_STATE)
  const [isHydrated, setIsHydrated] = useState(false)
  const [wasRestoredFromStorage, setWasRestoredFromStorage] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(CATALOG_FILTERS_STORAGE_KEY)
    const stored = parseStoredFilters(raw)
    if (stored && raw) {
      setFilters(stored)
      setWasRestoredFromStorage(true)
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    const timer = window.setTimeout(() => {
      localStorage.setItem(CATALOG_FILTERS_STORAGE_KEY, JSON.stringify(filters))
    }, PERSIST_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [filters, isHydrated])

  const resetFilters = useCallback(() => {
    localStorage.removeItem(CATALOG_FILTERS_STORAGE_KEY)
    setFilters(DEFAULT_CATALOG_FILTER_STATE)
    setWasRestoredFromStorage(false)
  }, [])

  return {
    filters,
    setFilters,
    resetFilters,
    isHydrated,
    wasRestoredFromStorage,
    defaultFilters: DEFAULT_CATALOG_FILTER_STATE,
  }
}
