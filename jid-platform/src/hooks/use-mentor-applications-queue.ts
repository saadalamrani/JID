'use client'

import { useQuery } from '@tanstack/react-query'
import type { MentorApplicationQueueItem } from '@/lib/staff/mentor-applications'

export const mentorApplicationsQueryKey = ['admin', 'mentor-applications'] as const

type MentorApplicationsResponse = {
  applications: MentorApplicationQueueItem[]
  stats: { pending: number }
}

export function useMentorApplicationsQueue() {
  return useQuery({
    queryKey: mentorApplicationsQueryKey,
    queryFn: async (): Promise<MentorApplicationsResponse> => {
      const response = await fetch('/api/admin/mentor-applications', { credentials: 'include' })
      const body = (await response.json()) as MentorApplicationsResponse & { error?: string }
      if (!response.ok) {
        throw new Error(body.error ?? 'تعذّر تحميل طلبات المرشدين')
      }
      return body
    },
    refetchInterval: 30_000,
  })
}
