import 'server-only'

import type { AnnouncementCategory } from '@/lib/validations/announcement'
import { createClient } from '@/lib/supabase/server'

export type AnnouncementRow = {
  id: string
  title_ar: string
  body_ar: string | null
  category: AnnouncementCategory
  starts_at: string
  expires_at: string
  cta_url: string | null
  cta_label_ar: string | null
  is_featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

export type AnnouncementListFilters = {
  category?: AnnouncementCategory | 'all'
  status?: 'all' | 'published' | 'draft' | 'expired' | 'scheduled'
  search?: string
}

export async function fetchStaffAnnouncements(
  filters: AnnouncementListFilters = {},
): Promise<AnnouncementRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from('public_announcements')
    .select(
      'id, title_ar, body_ar, category, starts_at, expires_at, cta_url, cta_label_ar, is_featured, is_published, created_at, updated_at',
    )
    .order('created_at', { ascending: false })

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  if (filters.status === 'published') {
    query = query.eq('is_published', true)
  } else if (filters.status === 'draft') {
    query = query.eq('is_published', false)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  let rows = (data ?? []) as AnnouncementRow[]
  const now = Date.now()

  if (filters.status === 'expired') {
    rows = rows.filter((row) => new Date(row.expires_at).getTime() <= now)
  } else if (filters.status === 'scheduled') {
    rows = rows.filter(
      (row) => row.is_published && new Date(row.starts_at).getTime() > now,
    )
  }

  const search = filters.search?.trim()
  if (search) {
    const needle = search.toLowerCase()
    rows = rows.filter(
      (row) =>
        row.title_ar.toLowerCase().includes(needle) ||
        (row.body_ar?.toLowerCase().includes(needle) ?? false),
    )
  }

  return rows
}

export async function fetchAnnouncementById(id: string): Promise<AnnouncementRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('public_announcements')
    .select(
      'id, title_ar, body_ar, category, starts_at, expires_at, cta_url, cta_label_ar, is_featured, is_published, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as AnnouncementRow | null) ?? null
}

/** Public RLS view — published, started, not expired. */
export async function fetchPublicVisibleAnnouncements(): Promise<AnnouncementRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('public_announcements')
    .select(
      'id, title_ar, body_ar, category, starts_at, expires_at, cta_url, cta_label_ar, is_featured, is_published, created_at, updated_at',
    )
    .order('starts_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as AnnouncementRow[]
}
