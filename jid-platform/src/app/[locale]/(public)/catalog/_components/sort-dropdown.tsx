'use client'

import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCatalogFilters } from './catalog-filter-context'

const SORT_VALUES = ['alphabetical_en', 'manual_order'] as const

export function SortDropdown() {
  const { filters, setSort } = useCatalogFilters()
  const t = useTranslations('filters')

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{t('sortGroupLabel')}</p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label={`${t('sortGroupLabel')}: ${t(`sort.${filters.sort}`)}`}
            className="w-full justify-between border-border bg-card font-normal text-foreground hover:bg-background sm:w-auto sm:min-w-[10rem]"
          >
            {t(`sort.${filters.sort}`)}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[10rem] border-border bg-card">
          <DropdownMenuRadioGroup
            value={filters.sort}
            onValueChange={(value) => setSort(value as typeof filters.sort)}
          >
            {SORT_VALUES.map((value) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                className="text-foreground focus:bg-background focus:text-foreground"
              >
                {t(`sort.${value}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
