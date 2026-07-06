import type { MentorActiveWorkshop } from '@/lib/profile/types'

export type ParsedActiveWorkshop = MentorActiveWorkshop & {
  workshop_date: string | null
  is_active: boolean
}

export function parseActiveWorkshopJson(raw: unknown): ParsedActiveWorkshop | null {
  if (!raw || typeof raw !== 'object') return null
  const w = raw as Record<string, unknown>
  if (typeof w.title !== 'string' || !w.title.trim()) return null

  const workshopDate =
    (typeof w.workshop_date === 'string' && w.workshop_date) ||
    (typeof w.scheduled_at === 'string' && w.scheduled_at) ||
    null

  return {
    title: w.title,
    title_ar: (w.title_ar as string | null) ?? null,
    scheduled_at: workshopDate,
    workshop_date: workshopDate,
    is_active: w.is_active !== false,
    spots_remaining: w.spots_remaining != null ? Number(w.spots_remaining) : null,
    url: (w.url as string | null) ?? null,
  }
}

/** Section 4.5 — chip visible only when workshop is active and in the future. */
export function isLiveActiveWorkshop(workshop: ParsedActiveWorkshop | null): boolean {
  if (!workshop || !workshop.is_active || !workshop.workshop_date) return false
  const when = new Date(workshop.workshop_date).getTime()
  if (Number.isNaN(when)) return false
  return when > Date.now()
}
