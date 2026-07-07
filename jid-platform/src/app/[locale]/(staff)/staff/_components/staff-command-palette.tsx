'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { STAFF_QUICK_ACTIONS } from '@/lib/staff/constants'
import type { StaffSearchResponse } from '@/types/staff-search'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent } from '@/components/ui/dialog'

const SEARCH_DEBOUNCE_MS = 200
const EMPTY_RESULTS: StaffSearchResponse = { users: [], entities: [], claims: [] }

type StaffCommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Section 6 / 12 — bounded staff command palette (Cmd+K / Ctrl+K). */
export function StaffCommandPalette({ open, onOpenChange }: StaffCommandPaletteProps) {
  const t = useTranslations('staff.commandPalette')
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StaffSearchResponse>(EMPTY_RESULTS)
  const [isSearching, setIsSearching] = useState(false)

  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS)
  const hasQuery = debouncedQuery.trim().length > 0

  const reset = useCallback(() => {
    setQuery('')
    setResults(EMPTY_RESULTS)
    setIsSearching(false)
  }, [])

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (!trimmed) {
      setResults(EMPTY_RESULTS)
      setIsSearching(false)
      return
    }

    let cancelled = false
    setIsSearching(true)

    const run = async () => {
      try {
        const response = await fetch(`/staff/search?q=${encodeURIComponent(trimmed)}`, {
          credentials: 'same-origin',
        })

        if (!response.ok) {
          if (!cancelled) setResults(EMPTY_RESULTS)
          return
        }

        const data = (await response.json()) as StaffSearchResponse
        if (!cancelled) setResults(data)
      } catch {
        if (!cancelled) setResults(EMPTY_RESULTS)
      } finally {
        if (!cancelled) setIsSearching(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  const navigate = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  const showEmpty =
    hasQuery &&
    !isSearching &&
    results.users.length === 0 &&
    results.entities.length === 0 &&
    results.claims.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg sm:max-w-lg [&>button]:hidden">
        <Command shouldFilter={false} className="rounded-lg border-0">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={t('placeholder')}
            aria-label={t('placeholder')}
          />
          <CommandList>
            {!hasQuery ? (
              <CommandGroup
                heading={t('quickActions')}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-jid-ink/50"
              >
                {STAFF_QUICK_ACTIONS.map((action) => (
                  <CommandItem
                    key={action.key}
                    value={`${action.key} ${action.keywords?.join(' ') ?? ''}`}
                    onSelect={() => navigate(action.href)}
                  >
                    {t(`actions.${action.key}`)}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {hasQuery && results.users.length > 0 ? (
              <CommandGroup
                heading={t('groups.users')}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-jid-ink/50"
              >
                {results.users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`user-${user.id}-${user.label}`}
                    onSelect={() => navigate(user.href)}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{user.label}</span>
                      <span className="truncate text-xs text-jid-ink/50">{user.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {hasQuery && results.entities.length > 0 ? (
              <CommandGroup
                heading={t('groups.entities')}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-jid-ink/50"
              >
                {results.entities.map((entity) => (
                  <CommandItem
                    key={entity.id}
                    value={`entity-${entity.id}-${entity.label}`}
                    onSelect={() => navigate(entity.href)}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{entity.label}</span>
                      <span className="truncate text-xs text-jid-ink/50">{entity.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {hasQuery && results.claims.length > 0 ? (
              <CommandGroup
                heading={t('groups.claims')}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-jid-ink/50"
              >
                {results.claims.map((claim) => (
                  <CommandItem
                    key={claim.id}
                    value={`claim-${claim.id}-${claim.label}`}
                    onSelect={() => navigate(claim.href)}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{claim.label}</span>
                      <span className="truncate text-xs text-jid-ink/50">{claim.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {isSearching && hasQuery ? (
              <p className="py-6 text-center text-sm text-jid-ink/50">{t('searching')}</p>
            ) : null}

            {showEmpty ? <CommandEmpty>{t('noResults')}</CommandEmpty> : null}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export function useStaffCommandPaletteHotkey(onToggle: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        onToggle()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onToggle])
}
