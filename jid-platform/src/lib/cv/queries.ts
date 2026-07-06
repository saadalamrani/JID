'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cvQueryKey, fetchCvClient, patchCvHeaderClient, patchCvSkillsClient } from '@/lib/cv/client'
import type { CvHeaderDbPatch } from '@/lib/cv/schemas/header'
import type { CvSkillsDbPatch } from '@/lib/cv/schemas/skills-section'
import type { CvFullRecord } from '@/types/cv'

export { cvQueryKey } from '@/lib/cv/client'

/** Fetch full CV document for the builder (Section 7.3). */
export function useCv(cvId: string, initialData?: CvFullRecord) {
  return useQuery({
    queryKey: cvQueryKey(cvId),
    queryFn: () => fetchCvClient(cvId),
    initialData,
    staleTime: 30_000,
  })
}

/** Patch `cvs` header row with optimistic cache update (Section 7.6 / 9). */
export function useUpdateCvHeader(cvId: string) {
  const queryClient = useQueryClient()
  const queryKey = cvQueryKey(cvId)

  return useMutation({
    mutationFn: (patch: CvHeaderDbPatch) => patchCvHeaderClient(cvId, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<CvFullRecord>(queryKey)
      const now = new Date().toISOString()

      queryClient.setQueryData<CvFullRecord>(queryKey, (current) => {
        if (!current) return current
        return {
          ...current,
          ...patch,
          updated_at: now,
        }
      })

      return { previous }
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
    },
  })
}

/** Patch `cvs` skills + languages JSONB (Section 7.9). */
export function useUpdateCvSkills(cvId: string) {
  const queryClient = useQueryClient()
  const queryKey = cvQueryKey(cvId)

  return useMutation({
    mutationFn: (patch: CvSkillsDbPatch) => patchCvSkillsClient(cvId, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CvFullRecord>(queryKey)
      const now = new Date().toISOString()

      queryClient.setQueryData<CvFullRecord>(queryKey, (current) => {
        if (!current) return current
        return {
          ...current,
          technical_skills: patch.technical_skills,
          languages: patch.languages,
          updated_at: now,
        }
      })

      return { previous }
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data)
    },
  })
}
