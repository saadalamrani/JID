'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { CATEGORY_LABELS } from '@/lib/cv/pdf-helpers'
import { isBuilderAdditionalCategory } from '@/lib/cv/schemas/additional'
import { useAdditionalEntries } from '@/lib/hooks/use-additional-entries'
import type { CvAdditionalDbPatch } from '@/lib/cv/schemas/additional'
import { BUILDER_ADDITIONAL_CATEGORIES, type BuilderAdditionalCategory, type CvFullRecord } from '@/types/cv'
import { useLocale } from 'next-intl'
import { AdditionalEntryCard } from './additional-entry-card'

type SectionAdditionalFormProps = {
  cv: CvFullRecord
}

/** Section 7.9 — additional items grouped by category (matches PDF `groupAdditional`). */
export function SectionAdditionalForm({ cv }: SectionAdditionalFormProps) {
  const t = useTranslations('cv.builder.additional')
  const locale = useLocale() as 'ar' | 'en'
  const { addEntry, updateEntry, removeEntry, isBusy } = useAdditionalEntries(cv.id)

  const builderEntries = useMemo(
    () => cv.additional.filter((entry) => isBuilderAdditionalCategory(entry.category)),
    [cv.additional],
  )

  const grouped = useMemo(() => {
    const map = new Map<BuilderAdditionalCategory, typeof builderEntries>()
    for (const category of BUILDER_ADDITIONAL_CATEGORIES) {
      map.set(
        category,
        builderEntries
          .filter((entry) => entry.category === category)
          .sort((a, b) => a.sort_order - b.sort_order),
      )
    }
    return map
  }, [builderEntries])

  const handleAdd = useCallback(
    (category: BuilderAdditionalCategory) => {
      void addEntry.mutateAsync({
        category,
        title: t('newEntryDefaultTitle'),
        sort_order: cv.additional.length,
      })
    },
    [addEntry, cv.additional.length, t],
  )

  const handleSave = useCallback(
    async (entryId: string, patch: CvAdditionalDbPatch) => {
      await updateEntry.mutateAsync({ entryId, patch })
    },
    [updateEntry],
  )

  const handleRemove = useCallback(
    (entryId: string) => {
      void removeEntry.mutateAsync(entryId)
    },
    [removeEntry],
  )

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">{t('groupedHint')}</p>

      {BUILDER_ADDITIONAL_CATEGORIES.map((category) => {
        const items = grouped.get(category) ?? []
        const categoryLabel = CATEGORY_LABELS[locale][category]

        return (
          <section key={category} className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">{categoryLabel}</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => handleAdd(category)}
              >
                {t('addInCategory', { category: categoryLabel })}
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('emptyCategory')}</p>
            ) : (
              <div className="space-y-3">
                {items.map((entry) => (
                  <AdditionalEntryCard
                    key={entry.id}
                    entry={entry}
                    onSave={handleSave}
                    onRemove={handleRemove}
                    isRemoving={removeEntry.isPending}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
