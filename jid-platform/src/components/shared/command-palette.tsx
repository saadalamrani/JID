'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from '@/lib/i18n/navigation'
import { useDebounce } from '@/lib/hooks/use-debounce'
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

const GROUP_HEADING_CLASS =
  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground'

export type CommandPaletteQuickAction = {
  key: string
  href: string
  keywords?: string[]
}

export type CommandPaletteSearchItem = {
  id: string
  label: string
  subtitle: string
  href: string
}

export type CommandPaletteSearchGroup = {
  key: string
  items: CommandPaletteSearchItem[]
}

export type SharedCommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  placeholder: string
  quickActionsHeading: string
  quickActions: CommandPaletteQuickAction[]
  getActionLabel: (key: string) => string
  getGroupHeading: (key: string) => string
  searchingMessage: string
  noResultsMessage: string
  /** When set, enables server-side search groups (staff/sys). Omit for client-filtered quick actions only. */
  fetchSearchGroups?: (
    query: string,
    signal: AbortSignal,
  ) => Promise<CommandPaletteSearchGroup[]>
}

/** Role-aware command palette shell — quick actions + optional debounced server search. */
export function SharedCommandPalette({
  open,
  onOpenChange,
  placeholder,
  quickActionsHeading,
  quickActions,
  getActionLabel,
  getGroupHeading,
  searchingMessage,
  noResultsMessage,
  fetchSearchGroups,
}: SharedCommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searchGroups, setSearchGroups] = useState<CommandPaletteSearchGroup[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS)
  const hasQuery = debouncedQuery.trim().length > 0
  const usesServerSearch = Boolean(fetchSearchGroups)

  const reset = useCallback(() => {
    setQuery('')
    setSearchGroups([])
    setIsSearching(false)
  }, [])

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  useEffect(() => {
    if (!fetchSearchGroups) {
      return
    }

    const trimmed = debouncedQuery.trim()
    if (!trimmed) {
      setSearchGroups([])
      setIsSearching(false)
      return
    }

    const controller = new AbortController()
    setIsSearching(true)

    const run = async () => {
      try {
        const groups = await fetchSearchGroups(trimmed, controller.signal)
        if (!controller.signal.aborted) {
          setSearchGroups(groups)
        }
      } catch {
        if (!controller.signal.aborted) {
          setSearchGroups([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false)
        }
      }
    }

    void run()
    return () => controller.abort()
  }, [debouncedQuery, fetchSearchGroups])

  const navigate = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  const totalSearchResults = searchGroups.reduce((sum, group) => sum + group.items.length, 0)
  const showEmpty = usesServerSearch && hasQuery && !isSearching && totalSearchResults === 0
  const showQuickActions = !usesServerSearch || !hasQuery

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg sm:max-w-lg [&>button]:hidden">
        <Command shouldFilter={!usesServerSearch} className="rounded-lg border-0">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={placeholder}
            aria-label={placeholder}
          />
          <CommandList>
            {showQuickActions ? (
              <CommandGroup heading={quickActionsHeading} className={GROUP_HEADING_CLASS}>
                {quickActions.map((action) => (
                  <CommandItem
                    key={action.key}
                    value={`${getActionLabel(action.key)} ${action.key} ${action.keywords?.join(' ') ?? ''}`}
                    onSelect={() => navigate(action.href)}
                  >
                    {getActionLabel(action.key)}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {usesServerSearch && hasQuery
              ? searchGroups.map((group) =>
                  group.items.length > 0 ? (
                    <CommandGroup
                      key={group.key}
                      heading={getGroupHeading(group.key)}
                      className={GROUP_HEADING_CLASS}
                    >
                      {group.items.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={`${group.key}-${item.id}-${item.label}`}
                          onSelect={() => navigate(item.href)}
                        >
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate">{item.label}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {item.subtitle}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : null,
                )
              : null}

            {isSearching && hasQuery && usesServerSearch ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{searchingMessage}</p>
            ) : null}

            {showEmpty ? <CommandEmpty>{noResultsMessage}</CommandEmpty> : null}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export function useCommandPaletteHotkey(onToggle: () => void) {
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
