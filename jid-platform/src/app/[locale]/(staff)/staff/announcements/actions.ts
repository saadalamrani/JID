'use server'

import { revalidatePath } from 'next/cache'
import type { AnnouncementFormInput } from '@/lib/validations/announcement'
import { announcementFormSchema } from '@/lib/validations/announcement'
import { createClient } from '@/lib/supabase/server'
import { PRIVILEGED_STAFF_ROLES } from '@/lib/auth/rbac'
import type { UserRole } from '@/lib/auth/rbac'

export type AnnouncementActionResult = { ok: true; id?: string } | { ok: false; error: string }

async function requireStaffActor(): Promise<{ userId: string } | AnnouncementActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Authentication required' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role as UserRole | undefined
  if (!role || !(PRIVILEGED_STAFF_ROLES as readonly string[]).includes(role)) {
    return { ok: false, error: 'Only staff can manage announcements' }
  }

  return { userId: user.id }
}

function revalidateAnnouncementPaths(id?: string) {
  revalidatePath('/staff/announcements')
  revalidatePath('/staff/announcements/new')
  if (id) revalidatePath(`/staff/announcements/${id}/edit`)
}

function mapFormToRow(input: AnnouncementFormInput, actorId: string) {
  const parsed = announcementFormSchema.parse(input)
  const now = new Date().toISOString()

  return {
    title_ar: parsed.title_ar.trim(),
    body_ar: parsed.body_ar?.trim() ? parsed.body_ar.trim() : null,
    category: parsed.category,
    starts_at: new Date(parsed.starts_at).toISOString(),
    expires_at: new Date(parsed.expires_at).toISOString(),
    cta_url: parsed.cta_url?.trim() ? parsed.cta_url.trim() : null,
    cta_label_ar: parsed.cta_label_ar?.trim() ? parsed.cta_label_ar.trim() : null,
    is_featured: parsed.is_featured,
    is_published: parsed.is_published,
    updated_at: now,
    updated_by: actorId,
  }
}

export async function createAnnouncement(
  input: AnnouncementFormInput,
): Promise<AnnouncementActionResult> {
  const actor = await requireStaffActor()
  if ('ok' in actor) return actor

  const parsed = announcementFormSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid form data' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('public_announcements')
    .insert({
      ...mapFormToRow(parsed.data, actor.userId),
      created_by: actor.userId,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidateAnnouncementPaths(data.id)
  return { ok: true, id: data.id }
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementFormInput,
): Promise<AnnouncementActionResult> {
  const actor = await requireStaffActor()
  if ('ok' in actor) return actor

  const parsed = announcementFormSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid form data' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('public_announcements')
    .update(mapFormToRow(parsed.data, actor.userId))
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidateAnnouncementPaths(id)
  return { ok: true, id }
}

export async function deleteAnnouncement(id: string): Promise<AnnouncementActionResult> {
  const actor = await requireStaffActor()
  if ('ok' in actor) return actor

  const supabase = await createClient()
  const { error } = await supabase.from('public_announcements').delete().eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidateAnnouncementPaths(id)
  return { ok: true }
}
