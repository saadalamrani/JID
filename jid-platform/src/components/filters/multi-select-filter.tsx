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

type FilterOption = {
  value: string
  label: string
}

type MultiSelectFilterProps = {
  label: string
  options: FilterOption[]
  selected: string[]
  onToggle: (value: string) => void
  emptyLabel: string
  selectedLabel: (count: number) => string
}

export function MultiSelectFilter({
  label,
  options,
  selected,
  onToggle,
  emptyLabel,
  selectedLabel,
}: MultiSelectFilterProps) {
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
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selected.includes(option.value)}
              onCheckedChange={() => onToggle(option.value)}
              onSelect={(event) => event.preventDefault()}
              className="font-arabic text-foreground focus:bg-background focus:text-foreground"
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
