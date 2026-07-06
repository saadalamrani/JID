'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userApplicationsQueryKey } from '@/lib/applications/client'
import type { ApplicationStatus, UserApplicationsResult } from '@/types/application'
import type { RadarColumnId } from '@/lib/radar/column-config'

export type UpdateApplicationStatusInput = {
  applicationId: string
  status: ApplicationStatus
  fromColumn: RadarColumnId
  toColumn: RadarColumnId
}

async function patchApplicationStatus(input: UpdateApplicationStatusInput) {
  // Dev-only: throw here to verify optimistic rollback on network failure.
  // if (process.env.NODE_ENV === 'development') throw new Error('simulated radar mutation failure')

  const response = await fetch(`/api/radar/applications/${input.applicationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      status: input.status,
      fromColumn: input.fromColumn,
      toColumn: input.toColumn,
    }),
  })

  const body = (await response.json().catch(() => null)) as { error?: string } | null
  if (!response.ok) {
    throw new Error(body?.error ?? 'تعذّر تحديث الحالة')
  }

  return body
}

/** Section 9 — optimistic Radar status mutation (onMutate / onError rollback / onSettled invalidate). */
export function useUpdateApplicationStatus(userId: string) {
  const queryClient = useQueryClient()
  const queryKey = userApplicationsQueryKey(userId)

  return useMutation({
    mutationFn: patchApplicationStatus,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<UserApplicationsResult>(queryKey)
      const now = new Date().toISOString()

      queryClient.setQueryData<UserApplicationsResult>(queryKey, (current) => {
        if (!current) return current
        return {
          ...current,
          applications: current.applications.map((application) =>
            application.id === input.applicationId
              ? { ...application, status: input.status, updated_at: now }
              : application,
          ),
        }
      })

      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey })
    },
  })
}
