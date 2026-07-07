'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type ComboboxOption = {
  value: string
  label: string
  description?: string
}

type ComboboxProps = {
  options: ComboboxOption[]
  value: string | null
  onValueChange: (value: string) => void
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  disabled?: boolean
  onSearchChange?: (query: string) => void
}

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled = false,
  onSearchChange,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between border-jid-line font-normal"
        >
          {selected ? selected.label : placeholder}
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command
          shouldFilter={!onSearchChange}
          filter={(value, search, keywords) => {
            const haystack = normalizeSearch([value, ...(keywords ?? [])].join(' '))
            const needle = normalizeSearch(search)
            if (!needle) return 1
            return haystack.includes(needle) ? 1 : 0
          }}
        >
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={onSearchChange}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  keywords={[option.description ?? '', option.value]}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn('me-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')}
                  />
                  <div>
                    <p>{option.label}</p>
                    {option.description ? (
                      <p className="text-xs text-jid-ink/60">{option.description}</p>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
