'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createAdditionalEntryClient,
  cvQueryKey,
  deleteAdditionalEntryClient,
  updateAdditionalEntryClient,
} from '@/lib/cv/client'
import type { CvAdditionalDbPatch } from '@/lib/cv/schemas/additional'
import type { BuilderAdditionalCategory } from '@/types/cv'
import type { CvAdditionalRecord, CvFullRecord } from '@/types/cv'

function patchAdditionalEntry(
  cv: CvFullRecord,
  entryId: string,
  patch: CvAdditionalDbPatch,
): CvFullRecord {
  const now = new Date().toISOString()
  return {
    ...cv,
    updated_at: now,
    additional: [...cv.additional]
      .map((entry) =>
        entry.id === entryId ? { ...entry, ...patch, updated_at: now } : entry,
      )
      .sort((a, b) => a.sort_order - b.sort_order),
  }
}

/** Section 7.9 — CRUD for `cv_additional` with optimistic TanStack Query cache. */
export function useAdditionalEntries(cvId: string) {
  const queryClient = useQueryClient()
  const queryKey = cvQueryKey(cvId)

  const addEntry = useMutation({
    mutationFn: (payload: { category: BuilderAdditionalCategory; title: string; sort_order: number }) =>
      createAdditionalEntryClient(cvId, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CvFullRecord>(queryKey)
      const tempId = `temp-${Date.now()}`
      const now = new Date().toISOString()

      queryClient.setQueryData<CvFullRecord>(queryKey, (current) => {
        if (!current) return current
        const entry: CvAdditionalRecord = {
          id: tempId,
          cv_id: cvId,
          category: payload.category,
          title: payload.title,
          issuer: null,
          description: null,
          start_date: null,
          end_date: null,
          url: null,
          sort_order: payload.sort_order,
          created_at: now,
          updated_at: now,
        }
        return {
          ...current,
          additional: [...current.additional, entry].sort((a, b) => a.sort_order - b.sort_order),
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
    mutationFn: ({ entryId, patch }: { entryId: string; patch: CvAdditionalDbPatch }) =>
      updateAdditionalEntryClient(cvId, entryId, patch),
    onMutate: async ({ entryId, patch }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CvFullRecord>(queryKey)

      queryClient.setQueryData<CvFullRecord>(queryKey, (current) => {
        if (!current) return current
        return patchAdditionalEntry(current, entryId, patch)
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
    mutationFn: (entryId: string) => deleteAdditionalEntryClient(cvId, entryId),
    onMutate: async (entryId) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CvFullRecord>(queryKey)

      queryClient.setQueryData<CvFullRecord>(queryKey, (current) => {
        if (!current) return current
        return {
          ...current,
          additional: current.additional.filter((entry) => entry.id !== entryId),
        }
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

  return {
    addEntry,
    updateEntry,
    removeEntry,
    isBusy: addEntry.isPending || updateEntry.isPending || removeEntry.isPending,
  }
}
