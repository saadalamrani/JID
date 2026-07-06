import 'server-only'

import { createClient } from '@/lib/supabase/server'
import {
  assertFutureScheduledAt,
  workshopPatchSchema,
  workshopUpsertSchema,
  type WorkshopPatchInput,
  type WorkshopUpsertInput,
} from '@/lib/validations/workshop'

export class WorkshopError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'WorkshopError'
    this.status = status
  }
}

const WORKSHOP_SELECT =
  'id, mentor_id, title, title_ar, description, scheduled_at, capacity, spots_remaining, status, external_url, created_at, updated_at' as const

export type MentorWorkshopRow = {
  id: string
  mentor_id: string
  title: string
  title_ar: string | null
  description: string | null
  scheduled_at: string | null
  capacity: number
  spots_remaining: number
  status: string
  external_url: string | null
  created_at: string
  updated_at: string
}

export async function listMentorWorkshops(mentorId: string): Promise<MentorWorkshopRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mentor_workshops')
    .select(WORKSHOP_SELECT)
    .eq('mentor_id', mentorId)
    .order('scheduled_at', { ascending: true, nullsFirst: false })

  if (error) throw new WorkshopError(error.message, 500)
  return (data ?? []) as MentorWorkshopRow[]
}

export async function createMentorWorkshop(
  mentorId: string,
  input: WorkshopUpsertInput,
): Promise<MentorWorkshopRow> {
  const parsed = workshopUpsertSchema.parse(input)
  if (parsed.status === 'published') {
    try {
      assertFutureScheduledAt(parsed.scheduled_at)
    } catch {
      throw new WorkshopError('يجب أن يكون موعد الورشة في المستقبل', 400)
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mentor_workshops')
    .insert({
      mentor_id: mentorId,
      title: parsed.title,
      title_ar: parsed.title_ar?.trim() || null,
      description: parsed.description?.trim() || null,
      scheduled_at: parsed.scheduled_at,
      capacity: parsed.capacity,
      spots_remaining: parsed.capacity,
      status: parsed.status,
      external_url: parsed.external_url?.trim() || null,
    })
    .select(WORKSHOP_SELECT)
    .single()

  if (error || !data) throw new WorkshopError(error?.message ?? 'تعذّر إنشاء الورشة', 500)
  return data as MentorWorkshopRow
}

export async function updateMentorWorkshop(
  mentorId: string,
  workshopId: string,
  input: WorkshopPatchInput,
): Promise<MentorWorkshopRow> {
  const parsed = workshopPatchSchema.parse(input)
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('mentor_workshops')
    .select('id, mentor_id, capacity, spots_remaining')
    .eq('id', workshopId)
    .maybeSingle()

  if (fetchError) throw new WorkshopError(fetchError.message, 500)
  if (!existing || existing.mentor_id !== mentorId) {
    throw new WorkshopError('الورشة غير موجودة', 404)
  }

  if (parsed.scheduled_at) {
    const publishing = parsed.status === 'published' || undefined
    if (publishing !== false) {
      try {
        assertFutureScheduledAt(parsed.scheduled_at)
      } catch {
        throw new WorkshopError('يجب أن يكون موعد الورشة في المستقبل', 400)
      }
    }
  } else if (parsed.status === 'published') {
    const { data: row } = await supabase
      .from('mentor_workshops')
      .select('scheduled_at')
      .eq('id', workshopId)
      .maybeSingle()
    if (!row?.scheduled_at) {
      throw new WorkshopError('حدد موعد الورشة قبل النشر', 400)
    }
    try {
      assertFutureScheduledAt(row.scheduled_at)
    } catch {
      throw new WorkshopError('يجب أن يكون موعد الورشة في المستقبل', 400)
    }
  }

  const nextCapacity = parsed.capacity ?? existing.capacity
  const nextSpots =
    parsed.spots_remaining ??
    (parsed.capacity != null ? Math.min(existing.spots_remaining, nextCapacity) : existing.spots_remaining)

  const { data, error } = await supabase
    .from('mentor_workshops')
    .update({
      ...(parsed.title != null ? { title: parsed.title } : {}),
      ...(parsed.title_ar != null ? { title_ar: parsed.title_ar || null } : {}),
      ...(parsed.description != null ? { description: parsed.description || null } : {}),
      ...(parsed.scheduled_at != null ? { scheduled_at: parsed.scheduled_at } : {}),
      ...(parsed.capacity != null ? { capacity: parsed.capacity } : {}),
      spots_remaining: nextSpots,
      ...(parsed.status != null ? { status: parsed.status } : {}),
      ...(parsed.external_url != null ? { external_url: parsed.external_url || null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', workshopId)
    .eq('mentor_id', mentorId)
    .select(WORKSHOP_SELECT)
    .single()

  if (error || !data) throw new WorkshopError(error?.message ?? 'تعذّر تحديث الورشة', 500)
  return data as MentorWorkshopRow
}

export async function deleteMentorWorkshop(mentorId: string, workshopId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('mentor_workshops')
    .delete()
    .eq('id', workshopId)
    .eq('mentor_id', mentorId)

  if (error) throw new WorkshopError(error.message, 500)
}
