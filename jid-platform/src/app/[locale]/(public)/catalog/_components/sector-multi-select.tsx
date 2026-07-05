'use client'

import { useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCatalogFilters } from './catalog-filter-context'

export function SectorMultiSelect() {
  const { filters, sectors, toggleSector } = useCatalogFilters()
  const [open, setOpen] = useState(false)
  const selectedCount = filters.sectors.length

  return (
    <div className="space-y-2">
      <p className="font-arabic text-xs font-medium text-jid-ink/70">القطاع</p>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label={
              selectedCount > 0
                ? `القطاعات، ${selectedCount} محددة`
                : 'اختر القطاعات'
            }
            className="w-full justify-between border-jid-line bg-white font-arabic font-normal text-jid-ink hover:bg-jid-beige"
          >
            {selectedCount > 0 ? `القطاعات (${selectedCount})` : 'اختر القطاعات'}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto border-jid-line bg-white"
        >
          <DropdownMenuLabel className="font-arabic text-jid-ink">القطاعات</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-jid-line/40" />
          {sectors.map((sector) => (
            <DropdownMenuCheckboxItem
              key={sector.slug}
              checked={filters.sectors.includes(sector.slug)}
              onCheckedChange={() => toggleSector(sector.slug)}
              onSelect={(event) => event.preventDefault()}
              className="font-arabic text-jid-ink focus:bg-jid-beige focus:text-jid-ink"
            >
              {sector.name_ar ?? sector.name_en}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
