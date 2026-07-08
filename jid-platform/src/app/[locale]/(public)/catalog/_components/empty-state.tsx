'use client'

import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { useCatalogFilters } from './catalog-filter-context'

export function CatalogEmptyState() {
  const { resetFilters } = useCatalogFilters()

  return (
    <EmptyState
      icon={Search}
      title="لم نجد جهات تطابق فلاترك"
      description="جرّب توسيع نطاق البحث"
    >
      <Button type="button" onClick={resetFilters} className="font-arabic">
        إعادة تعيين الفلاتر
      </Button>
    </EmptyState>
  )
}
