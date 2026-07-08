'use client'

import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCatalogFilters } from './catalog-filter-context'

export function CatalogEmptyState() {
  const { resetFilters } = useCatalogFilters()

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <Search className="h-16 w-16 text-primary/30" strokeWidth={1.25} aria-hidden />
      <h2 className="mt-6 font-arabic text-xl font-semibold text-foreground">
        لم نجد جهات تطابق فلاترك
      </h2>
      <p className="mt-2 max-w-sm font-arabic text-sm text-muted-foreground">
        جرّب توسيع نطاق البحث
      </p>
      <Button
        type="button"
        onClick={resetFilters}
        className="mt-6 bg-primary font-arabic text-jid-beige hover:bg-primary-600"
      >
        إعادة تعيين الفلاتر
      </Button>
    </div>
  )
}
