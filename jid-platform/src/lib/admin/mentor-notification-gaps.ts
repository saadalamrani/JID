import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type NotificationGapRow = {
  sector: string
  expertise_area: string
  request_count: number
}

/**
 * Section 4.16 cold start — aggregate pending mentor notification requests
 * by desired sector / expertise for staff outreach prioritization.
 */
export async function fetchMentorNotificationGaps(): Promise<NotificationGapRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mentor_notification_requests')
    .select('desired_filters')
    .eq('status', 'pending')

  if (error) throw new Error(error.message)

  const counts = new Map<string, NotificationGapRow>()

  for (const row of data ?? []) {
    const filters = (row.desired_filters ?? {}) as {
      sectors?: string[]
      expertise_areas?: string[]
    }
    const sectors = filters.sectors?.length ? filters.sectors : ['(any sector)']
    const expertise = filters.expertise_areas?.length
      ? filters.expertise_areas
      : ['(any expertise)']

    for (const sector of sectors) {
      for (const expertise_area of expertise) {
        const key = `${sector}::${expertise_area}`
        const existing = counts.get(key)
        if (existing) {
          existing.request_count += 1
        } else {
          counts.set(key, { sector, expertise_area, request_count: 1 })
        }
      }
    }
  }

  return Array.from(counts.values()).sort((a, b) => b.request_count - a.request_count)
}
