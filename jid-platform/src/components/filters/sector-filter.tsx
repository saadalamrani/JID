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
import type { CatalogSectorRef } from '@/types/catalog'

type SectorFilterProps = {
  label: string
  sectors: CatalogSectorRef[]
  selected: string[]
  onToggle: (slug: string) => void
  emptyLabel: string
  selectedLabel: (count: number) => string
}

/** Reusable sector multi-select — data from Catalog `sectors` table via useCatalogSectors. */
export function SectorFilter({
  label,
  sectors,
  selected,
  onToggle,
  emptyLabel,
  selectedLabel,
}: SectorFilterProps) {
  const [open, setOpen] = useState(false)
  const selectedCount = selected.length

  return (
    <div className="space-y-2">
      <p className="font-arabic text-xs font-medium text-foreground/70">{label}</p>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label={selectedCount > 0 ? selectedLabel(selectedCount) : emptyLabel}
            className="w-full justify-between border-border bg-white font-arabic font-normal text-foreground hover:bg-background"
          >
            {selectedCount > 0 ? selectedLabel(selectedCount) : emptyLabel}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto border-border bg-white"
        >
          <DropdownMenuLabel className="font-arabic text-foreground">{label}</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/40" />
          {sectors.map((sector) => (
            <DropdownMenuCheckboxItem
              key={sector.slug}
              checked={selected.includes(sector.slug)}
              onCheckedChange={() => onToggle(sector.slug)}
              onSelect={(event) => event.preventDefault()}
              className="font-arabic text-foreground focus:bg-background focus:text-foreground"
            >
              {sector.name_ar ?? sector.name_en}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
