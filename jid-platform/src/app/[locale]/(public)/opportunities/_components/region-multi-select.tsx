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
import { useJobFilters } from './job-filter-context'

export function RegionMultiSelect() {
  const { filters, regions, toggleRegion } = useJobFilters()
  const [open, setOpen] = useState(false)
  const selectedCount = filters.regions.length

  return (
    <div className="space-y-2">
      <p className="font-arabic text-xs font-medium text-jid-ink-400">المنطقة</p>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label={
              selectedCount > 0 ? `المناطق، ${selectedCount} محددة` : 'اختر المناطق'
            }
            className="w-full justify-between border-jid-line bg-white font-arabic font-normal text-jid-ink hover:bg-jid-beige"
          >
            {selectedCount > 0 ? `المناطق (${selectedCount})` : 'اختر المناطق'}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto border-jid-line bg-white"
        >
          <DropdownMenuLabel className="font-arabic text-jid-ink">المناطق</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-jid-line/40" />
          {regions.map((region) => (
            <DropdownMenuCheckboxItem
              key={region.slug}
              checked={filters.regions.includes(region.slug)}
              onCheckedChange={() => toggleRegion(region.slug)}
              onSelect={(event) => event.preventDefault()}
              className="font-arabic text-jid-ink focus:bg-jid-beige focus:text-jid-ink"
            >
              {region.name_ar ?? region.name_en}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
