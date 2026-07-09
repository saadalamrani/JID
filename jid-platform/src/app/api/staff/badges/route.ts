import { NextResponse } from 'next/server'
import { PRIVILEGED_STAFF_ROLES, isRoleAllowed } from '@/lib/auth/rbac'
import { fetchProfileForUser } from '@/lib/auth/session'
import {
  getStaffBadgeCount,
  getStaffBadgeCounts,
  isStaffBadgeType,
  staffBadgeCacheHeaders,
} from '@/lib/staff/badges'
import { getDevTestStaffProfile } from '@/lib/staff/dev-test-access'
import { createClient } from '@/lib/supabase/server'

async function resolveBadgeActor(): Promise<{ userId: string } | null> {
  const devProfile = getDevTestStaffProfile()
  if (devProfile) return { userId: devProfile.id }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const profile = await fetchProfileForUser(supabase, user.id)
  if (!profile || !isRoleAllowed(profile.role, PRIVILEGED_STAFF_ROLES)) {
    return null
  }

  let isAal2 = false
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    isAal2 = aal?.currentLevel === 'aal2'
  } catch {
    isAal2 = false
  }

  if (!isAal2) return null

  return { userId: user.id }
}

/** Section 12 — live badge counts for staff sidebar (30s cache, polled every 30s). */
export async function GET(request: Request) {
  const actor = await resolveBadgeActor()
  if (!actor) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    if (type) {
      if (!isStaffBadgeType(type)) {
        return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
      }
      const count = await getStaffBadgeCount(supabase, type, actor.userId)
      return NextResponse.json(
        { type, count },
        { headers: staffBadgeCacheHeaders() },
      )
    }

    const counts = await getStaffBadgeCounts(supabase, actor.userId)
    return NextResponse.json(counts, { headers: staffBadgeCacheHeaders() })
  } catch {
    const fallback = {
      claims: 0,
      pending: 0,
      assigned: 0,
      mentorApplications: 0,
      mentor_apps: 0,
      openFlags: 0,
      open_flags: 0,
      lammahHidden: 0,
      lammah_hidden: 0,
      notifications: 0,
    }
    if (type && isStaffBadgeType(type)) {
      return NextResponse.json(
        { type, count: 0 },
        { headers: staffBadgeCacheHeaders() },
      )
    }
    return NextResponse.json(fallback, { headers: staffBadgeCacheHeaders() })
  }
}
