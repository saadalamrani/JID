'use client'

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Briefcase } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useExperienceEntries } from '@/lib/hooks/use-experience-entries'
import type { CvExperienceDbPatch } from '@/lib/cv/schemas/experience'
import type { CvFullRecord } from '@/types/cv'
import { EmptyEntryState } from './empty-entry-state'
import { ExperienceEntryCard } from './experience-entry-card'

type SectionExperienceFormProps = {
  cv: CvFullRecord
}

/** Section 7.8 — sortable experience list with CRUD + achievements bullets. */
export function SectionExperienceForm({ cv }: SectionExperienceFormProps) {
  const t = useTranslations('cv.builder.experience')
  const { addEntry, updateEntry, removeEntry, reorderEntries, isBusy } = useExperienceEntries(cv.id)

  const entries = useMemo(
    () => [...cv.experience].sort((a, b) => a.sort_order - b.sort_order),
    [cv.experience],
  )

  const entryIds = useMemo(() => entries.map((entry) => entry.id), [entries])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  )

  const handleAdd = useCallback(() => {
    void addEntry.mutateAsync({
      company_name: t('newEntryDefaultOrg'),
      job_title: t('newEntryDefaultRole'),
      sort_order: entries.length,
    })
  }, [addEntry, entries.length, t])

  const handleSave = useCallback(
    async (entryId: string, patch: CvExperienceDbPatch) => {
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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = entryIds.indexOf(String(active.id))
      const newIndex = entryIds.indexOf(String(over.id))
      if (oldIndex < 0 || newIndex < 0) return

      const orderedIds = arrayMove(entryIds, oldIndex, newIndex)
      void reorderEntries.mutateAsync(orderedIds)
    },
    [entryIds, reorderEntries],
  )

  if (entries.length === 0) {
    return (
      <EmptyEntryState
        title={t('emptyTitle')}
        description={t('emptyDescription')}
        actionLabel={t('addEntry')}
        onAction={handleAdd}
        isLoading={addEntry.isPending}
        icon={<Briefcase className="h-6 w-6" aria-hidden />}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-jid-ink/50">{t('reorderHint')}</p>
        <Button type="button" size="sm" variant="outline" onClick={handleAdd} disabled={isBusy}>
          {t('addEntry')}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={entryIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <ExperienceEntryCard
                key={entry.id}
                entry={entry}
                index={index}
                onSave={handleSave}
                onRemove={handleRemove}
                isRemoving={removeEntry.isPending}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
