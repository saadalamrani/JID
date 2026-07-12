import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { PENDING_CLAIM_STATUSES } from '@/lib/staff/claims'

export const STAFF_BADGE_TYPES = [
  'assigned',
  'pending',
  'open_flags',
  'mentor_apps',
  'lammah_hidden',
] as const

export type StaffBadgeType = (typeof STAFF_BADGE_TYPES)[number]

export type StaffBadgeCounts = {
  /** Pending verification requests in queue (all staff). */
  verification: number
  /** @deprecated alias for verification */
  claims: number
  pending: number
  /** Claims assigned to the signed-in staff member. */
  assigned: number
  mentorApplications: number
  mentor_apps: number
  openFlags: number
  open_flags: number
  lammahHidden: number
  lammah_hidden: number
  correctionSuggestions: number
  notifications: number
}

type Client = SupabaseClient<Database>

const OPEN_FLAG_STATUSES = ['pending', 'under_review'] as const

const CACHE_MAX_AGE_SECONDS = 30

export function staffBadgeCacheHeaders(): HeadersInit {
  return {
    'Cache-Control': `private, max-age=${CACHE_MAX_AGE_SECONDS}`,
  }
}

export async function getStaffBadgeCount(
  supabase: Client,
  type: StaffBadgeType,
  actorId: string,
): Promise<number> {
  switch (type) {
    case 'assigned': {
      const { count, error } = await supabase
        .from('verification_requests')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_staff_id', actorId)
        .in('status', [...PENDING_CLAIM_STATUSES])
      if (error) throw new Error(error.message)
      return count ?? 0
    }
    case 'pending': {
      const { count, error } = await supabase
        .from('verification_requests')
        .select('id', { count: 'exact', head: true })
        .in('status', [...PENDING_CLAIM_STATUSES])
      if (error) throw new Error(error.message)
      return count ?? 0
    }
    case 'open_flags': {
      const { count, error } = await supabase
        .from('content_flags')
        .select('id', { count: 'exact', head: true })
        .in('status', [...OPEN_FLAG_STATUSES])
      if (error) throw new Error(error.message)
      return count ?? 0
    }
    case 'mentor_apps': {
      const { count, error } = await supabase
        .from('mentor_profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('status', 'pending_review')
      if (error) throw new Error(error.message)
      return count ?? 0
    }
    case 'lammah_hidden': {
      const { count, error } = await supabase
        .from('lammah_opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'hidden')
      if (error) throw new Error(error.message)
      return count ?? 0
    }
    default:
      return 0
  }
}

async function getCorrectionSuggestionsCount(supabase: Client): Promise<number> {
  const { count, error } = await supabase
    .from('directory_correction_suggestions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function getStaffBadgeCounts(
  supabase: Client,
  actorId: string,
): Promise<StaffBadgeCounts> {
  const [pending, assigned, openFlags, mentorApps, lammahHidden, correctionSuggestions] =
    await Promise.all([
    getStaffBadgeCount(supabase, 'pending', actorId),
    getStaffBadgeCount(supabase, 'assigned', actorId),
    getStaffBadgeCount(supabase, 'open_flags', actorId),
    getStaffBadgeCount(supabase, 'mentor_apps', actorId),
    getStaffBadgeCount(supabase, 'lammah_hidden', actorId),
    getCorrectionSuggestionsCount(supabase),
  ])

  return {
    claims: pending,
    verification: pending,
    pending,
    assigned,
    mentorApplications: mentorApps,
    mentor_apps: mentorApps,
    openFlags,
    open_flags: openFlags,
    lammahHidden,
    lammah_hidden: lammahHidden,
    correctionSuggestions,
    notifications: 0,
  }
}

export function isStaffBadgeType(value: string): value is StaffBadgeType {
  return (STAFF_BADGE_TYPES as readonly string[]).includes(value)
}
