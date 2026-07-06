'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createExperienceEntryClient,
  cvQueryKey,
  deleteExperienceEntryClient,
  reorderExperienceEntriesClient,
  updateExperienceEntryClient,
} from '@/lib/cv/client'
import type { CvExperienceDbPatch } from '@/lib/cv/schemas/experience'
import type { CvExperienceRecord, CvFullRecord } from '@/types/cv'

function sortExperience(entries: CvExperienceRecord[]) {
  return [...entries].sort((a, b) => a.sort_order - b.sort_order)
}

function patchExperienceEntry(
  cv: CvFullRecord,
  entryId: string,
  patch: CvExperienceDbPatch,
): CvFullRecord {
  const now = new Date().toISOString()
  return {
    ...cv,
    updated_at: now,
    experience: sortExperience(
      cv.experience.map((entry) =>
        entry.id === entryId ? { ...entry, ...patch, updated_at: now } : entry,
      ),
    ),
  }
}

/** Section 7.8 — CRUD + reorder for `cv_experience` with optimistic TanStack Query cache. */
export function useExperienceEntries(cvId: string) {
  const queryClient = useQueryClient()
  const queryKey = cvQueryKey(cvId)

  const addEntry = useMutation({
    mutationFn: (payload: { company_name: string; job_title: string; sort_order: number }) =>
      createExperienceEntryClient(cvId, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CvFullRecord>(queryKey)
      const tempId = `temp-${Date.now()}`
      const now = new Date().toISOString()

      queryClient.setQueryData<CvFullRecord>(queryKey, (current) => {
        if (!current) return current
        const entry: CvExperienceRecord = {
          id: tempId,
          cv_id: cvId,
          company_name: payload.company_name,
          company_city: null,
          company_country: null,
          job_title: payload.job_title,
          location: null,
          employment_type: null,
          start_month: null,
          start_year: null,
          end_month: null,
          end_year: null,
          is_current: false,
          bullets: [],
          sort_order: payload.sort_order,
          created_at: now,
          updated_at: now,
        }
        return {
          ...current,
          experience: sortExperience([...current.experience, entry]),
        }
      })

      return { previous }
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
    },
  })

  const updateEntry = useMutation({
    mutationFn: ({ entryId, patch }: { entryId: string; patch: CvExperienceDbPatch }) =>
      updateExperienceEntryClient(cvId, entryId, patch),
    onMutate: async ({ entryId, patch }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CvFullRecord>(queryKey)

      queryClient.setQueryData<CvFullRecord>(queryKey, (current) => {
        if (!current) return current
        return patchExperienceEntry(current, entryId, patch)
      })

      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
    },
  })

  const removeEntry = useMutation({
    mutationFn: (entryId: string) => deleteExperienceEntryClient(cvId, entryId),
    onMutate: async (entryId) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CvFullRecord>(queryKey)

      queryClient.setQueryData<CvFullRecord>(queryKey, (current) => {
        if (!current) return current
        const remaining = current.experience
          .filter((entry) => entry.id !== entryId)
          .map((entry, index) => ({ ...entry, sort_order: index }))
        return { ...current, experience: remaining }
      })

      return { previous }
    },
    onError: (_error, _entryId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
    },
  })

  const reorderEntries = useMutation({
    mutationFn: (orderedIds: string[]) => reorderExperienceEntriesClient(cvId, orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CvFullRecord>(queryKey)

      queryClient.setQueryData<CvFullRecord>(queryKey, (current) => {
        if (!current) return current
        const byId = new Map(current.experience.map((entry) => [entry.id, entry]))
        const reordered = orderedIds
          .map((id, index) => {
            const entry = byId.get(id)
            return entry ? { ...entry, sort_order: index } : null
          })
          .filter((entry): entry is CvExperienceRecord => entry != null)
        return { ...current, experience: reordered }
      })

      return { previous }
    },
    onError: (_error, _orderedIds, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
    },
  })

  return {
    addEntry,
    updateEntry,
    removeEntry,
    reorderEntries,
    isBusy:
      addEntry.isPending ||
      updateEntry.isPending ||
      removeEntry.isPending ||
      reorderEntries.isPending,
  }
}
