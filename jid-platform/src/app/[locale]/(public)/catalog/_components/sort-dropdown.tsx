'use client'

import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SORT_LABELS } from '@/types/catalog'
import { useCatalogFilters } from './catalog-filter-context'

const SORT_VALUES = ['alphabetical_en', 'manual_order'] as const

export function SortDropdown() {
  const { filters, setSort } = useCatalogFilters()

  return (
    <div className="space-y-2">
      <p className="font-arabic text-xs font-medium text-jid-ink/70">الترتيب</p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label={`الترتيب: ${SORT_LABELS[filters.sort]}`}
            className="w-full justify-between border-jid-line bg-white font-arabic font-normal text-jid-ink hover:bg-jid-beige sm:w-auto sm:min-w-[10rem]"
          >
            {SORT_LABELS[filters.sort]}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[10rem] border-jid-line bg-white font-arabic"
        >
          <DropdownMenuRadioGroup
            value={filters.sort}
            onValueChange={(value) => setSort(value as typeof filters.sort)}
          >
            {SORT_VALUES.map((value) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                className="text-jid-ink focus:bg-jid-beige focus:text-jid-ink"
              >
                {SORT_LABELS[value]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
