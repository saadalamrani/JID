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
      <p className="font-arabic text-xs font-medium text-foreground-400">المنطقة</p>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label={
              selectedCount > 0 ? `المناطق، ${selectedCount} محددة` : 'اختر المناطق'
            }
            className="w-full justify-between border-border bg-card font-arabic font-normal text-foreground hover:bg-background"
          >
            {selectedCount > 0 ? `المناطق (${selectedCount})` : 'اختر المناطق'}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto border-border bg-card"
        >
          <DropdownMenuLabel className="font-arabic text-foreground">المناطق</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/30" />
          {regions.map((region) => (
            <DropdownMenuCheckboxItem
              key={region.slug}
              checked={filters.regions.includes(region.slug)}
              onCheckedChange={() => toggleRegion(region.slug)}
              onSelect={(event) => event.preventDefault()}
              className="font-arabic text-foreground focus:bg-background focus:text-foreground"
            >
              {region.name_ar ?? region.name_en}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
