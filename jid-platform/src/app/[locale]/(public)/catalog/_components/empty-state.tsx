'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { useCatalogFilters } from './catalog-filter-context'

export function CatalogEmptyState() {
  const t = useTranslations('catalogPage.search')
  const { resetFilters } = useCatalogFilters()

  return (
    <EmptyState
      icon={Search}
      title={t('emptyTitle')}
      description={t('emptyDescription')}
    >
      <Button type="button" onClick={resetFilters} className="font-arabic">
        {t('resetFilters')}
      </Button>
    </EmptyState>
  )
}
