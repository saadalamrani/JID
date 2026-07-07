import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import type { ContentFlagTargetType } from '@/lib/validations/staff'

export type StaffFlagQueueItem = {
  id: string
  target_type: ContentFlagTargetType
  target_id: string
  reason: string
  details: string | null
  status: string
  reporter_id: string
  reporter_name: string | null
  created_at: string
}

export type StaffFlagDetail = StaffFlagQueueItem & {
  reviewed_by: string | null
  reviewed_at: string | null
  resolution_notes: string | null
  assigned_staff_id: string | null
}

export type StaffFlagTargetPreview = {
  title: string
  subtitle: string | null
  body: string | null
  href: string | null
}

const OPEN_FLAG_STATUSES = ['pending', 'under_review'] as const

export async function fetchStaffOpenFlags(): Promise<StaffFlagQueueItem[]> {
  await requireStaffShellAccess()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('content_flags')
    .select(
      'id, target_type, target_id, reason, details, status, reporter_id, created_at, reporter:profiles!content_flags_reporter_id_fkey(full_name)',
    )
    .in('status', [...OPEN_FLAG_STATUSES])
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const reporter = row.reporter as { full_name: string | null } | null
    return {
      id: row.id,
      target_type: row.target_type as ContentFlagTargetType,
      target_id: row.target_id,
      reason: row.reason,
      details: row.details,
      status: row.status,
      reporter_id: row.reporter_id,
      reporter_name: reporter?.full_name ?? null,
      created_at: row.created_at,
    }
  })
}

export async function fetchStaffFlagDetail(flagId: string): Promise<StaffFlagDetail | null> {
  await requireStaffShellAccess()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('content_flags')
    .select(
      'id, target_type, target_id, reason, details, status, reporter_id, created_at, reviewed_by, reviewed_at, resolution_notes, assigned_staff_id, reporter:profiles!content_flags_reporter_id_fkey(full_name)',
    )
    .eq('id', flagId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const reporter = data.reporter as { full_name: string | null } | null
  return {
    id: data.id,
    target_type: data.target_type as ContentFlagTargetType,
    target_id: data.target_id,
    reason: data.reason,
    details: data.details,
    status: data.status,
    reporter_id: data.reporter_id,
    reporter_name: reporter?.full_name ?? null,
    created_at: data.created_at,
    reviewed_by: data.reviewed_by,
    reviewed_at: data.reviewed_at,
    resolution_notes: data.resolution_notes,
    assigned_staff_id: data.assigned_staff_id,
  }
}

/** Preview flagged resource for moderation detail (Section 10). */
export async function fetchStaffFlagTargetPreview(
  targetType: ContentFlagTargetType,
  targetId: string,
): Promise<StaffFlagTargetPreview | null> {
  await requireStaffShellAccess()
  const supabase = await createClient()

  switch (targetType) {
    case 'profile': {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', targetId)
        .maybeSingle()
      if (!data) return null
      return {
        title: data.full_name ?? 'Unnamed profile',
        subtitle: data.role,
        body: null,
        href: null,
      }
    }
    case 'mentor_profile': {
      const { data } = await supabase
        .from('mentor_profiles')
        .select('user_id, headline, bio_long, status, profiles!mentor_profiles_user_id_fkey(full_name)')
        .eq('user_id', targetId)
        .maybeSingle()
      if (!data) return null
      const profile = data.profiles as { full_name: string | null } | null
      return {
        title: profile?.full_name ?? data.headline ?? 'Mentor profile',
        subtitle: data.status,
        body: data.bio_long,
        href: null,
      }
    }
    case 'company': {
      const { data } = await supabase
        .from('companies')
        .select('id, name, name_ar, entity_type, description_en')
        .eq('id', targetId)
        .maybeSingle()
      if (!data) return null
      return {
        title: data.name,
        subtitle: data.entity_type,
        body: data.description_en,
        href: `/staff/entities/${data.id}`,
      }
    }
    case 'job': {
      const { data } = await supabase
        .from('jobs')
        .select('id, title_en, title_ar, status, description_en')
        .eq('id', targetId)
        .maybeSingle()
      if (!data) return null
      return {
        title: data.title_en ?? data.title_ar,
        subtitle: data.status,
        body: data.description_en,
        href: null,
      }
    }
    case 'announcement': {
      const { data } = await supabase
        .from('public_announcements')
        .select('id, title_ar, body_ar, is_published')
        .eq('id', targetId)
        .maybeSingle()
      if (!data) return null
      return {
        title: data.title_ar,
        subtitle: data.is_published ? 'published' : 'draft',
        body: data.body_ar,
        href: null,
      }
    }
    default:
      return {
        title: `${targetType} · ${targetId}`,
        subtitle: null,
        body: null,
        href: null,
      }
  }
}
