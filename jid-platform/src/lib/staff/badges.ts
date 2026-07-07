import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { PENDING_CLAIM_STATUSES } from '@/lib/staff/claims'

export const STAFF_BADGE_TYPES = [
  'assigned',
  'pending',
  'open_flags',
  'mentor_apps',
] as const

export type StaffBadgeType = (typeof STAFF_BADGE_TYPES)[number]

export type StaffBadgeCounts = {
  /** Pending claims in queue (all staff). */
  claims: number
  pending: number
  /** Claims assigned to the signed-in staff member. */
  assigned: number
  mentorApplications: number
  mentor_apps: number
  openFlags: number
  open_flags: number
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
        .from('claim_requests')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_staff_id', actorId)
        .in('status', [...PENDING_CLAIM_STATUSES])
      if (error) throw new Error(error.message)
      return count ?? 0
    }
    case 'pending': {
      const { count, error } = await supabase
        .from('claim_requests')
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
    default:
      return 0
  }
}

export async function getStaffBadgeCounts(
  supabase: Client,
  actorId: string,
): Promise<StaffBadgeCounts> {
  const [pending, assigned, openFlags, mentorApps] = await Promise.all([
    getStaffBadgeCount(supabase, 'pending', actorId),
    getStaffBadgeCount(supabase, 'assigned', actorId),
    getStaffBadgeCount(supabase, 'open_flags', actorId),
    getStaffBadgeCount(supabase, 'mentor_apps', actorId),
  ])

  return {
    claims: pending,
    pending,
    assigned,
    mentorApplications: mentorApps,
    mentor_apps: mentorApps,
    openFlags,
    open_flags: openFlags,
    notifications: 0,
  }
}

export function isStaffBadgeType(value: string): value is StaffBadgeType {
  return (STAFF_BADGE_TYPES as readonly string[]).includes(value)
}
