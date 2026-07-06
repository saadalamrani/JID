'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createEducationEntryClient,
  cvQueryKey,
  deleteEducationEntryClient,
  reorderEducationEntriesClient,
  updateEducationEntryClient,
} from '@/lib/cv/client'
import type { CvEducationDbPatch } from '@/lib/cv/schemas/education'
import type { CvEducationRecord, CvFullRecord } from '@/types/cv'

function sortEducation(entries: CvEducationRecord[]) {
  return [...entries].sort((a, b) => a.sort_order - b.sort_order)
}

function patchEducationEntry(
  cv: CvFullRecord,
  entryId: string,
  patch: CvEducationDbPatch,
): CvFullRecord {
  const now = new Date().toISOString()
  return {
    ...cv,
    updated_at: now,
    education: sortEducation(
      cv.education.map((entry) =>
        entry.id === entryId ? { ...entry, ...patch, updated_at: now } : entry,
      ),
    ),
  }
}

/** Section 7.7 — CRUD + reorder for `cv_education` with optimistic TanStack Query cache. */
export function useEducationEntries(cvId: string) {
  const queryClient = useQueryClient()
  const queryKey = cvQueryKey(cvId)

  const addEntry = useMutation({
    mutationFn: (payload: { institution_name: string; sort_order: number }) =>
      createEducationEntryClient(cvId, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CvFullRecord>(queryKey)
      const tempId = `temp-${Date.now()}`
      const now = new Date().toISOString()

      queryClient.setQueryData<CvFullRecord>(queryKey, (current) => {
        if (!current) return current
        const entry: CvEducationRecord = {
          id: tempId,
          cv_id: cvId,
          institution_name: payload.institution_name,
          institution_city: null,
          institution_country: null,
          degree: null,
          field_of_study: null,
          graduation_year: null,
          gpa_value: null,
          gpa_scale: null,
          honors: null,
          relevant_coursework: null,
          start_month: null,
          start_year: null,
          end_month: null,
          end_year: null,
          is_current: false,
          sort_order: payload.sort_order,
          created_at: now,
          updated_at: now,
        }
        return {
          ...current,
          education: sortEducation([...current.education, entry]),
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
    mutationFn: ({ entryId, patch }: { entryId: string; patch: CvEducationDbPatch }) =>
      updateEducationEntryClient(cvId, entryId, patch),
    onMutate: async ({ entryId, patch }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CvFullRecord>(queryKey)

      queryClient.setQueryData<CvFullRecord>(queryKey, (current) => {
        if (!current) return current
        return patchEducationEntry(current, entryId, patch)
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
    mutationFn: (entryId: string) => deleteEducationEntryClient(cvId, entryId),
    onMutate: async (entryId) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CvFullRecord>(queryKey)

      queryClient.setQueryData<CvFullRecord>(queryKey, (current) => {
        if (!current) return current
        const remaining = current.education
          .filter((entry) => entry.id !== entryId)
          .map((entry, index) => ({ ...entry, sort_order: index }))
        return { ...current, education: remaining }
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
    mutationFn: (orderedIds: string[]) => reorderEducationEntriesClient(cvId, orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CvFullRecord>(queryKey)

      queryClient.setQueryData<CvFullRecord>(queryKey, (current) => {
        if (!current) return current
        const byId = new Map(current.education.map((entry) => [entry.id, entry]))
        const reordered = orderedIds
          .map((id, index) => {
            const entry = byId.get(id)
            return entry ? { ...entry, sort_order: index } : null
          })
          .filter((entry): entry is CvEducationRecord => entry != null)
        return { ...current, education: reordered }
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
