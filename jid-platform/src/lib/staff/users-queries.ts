import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import {
  isStaffManageableProfileRole,
  STAFF_USERS_PAGE_SIZE,
  type StaffUserAuditEvent,
  type StaffUserDetail,
  type StaffUserListRow,
  type StaffUsersListFilters,
  type StaffUsersListResult,
  type StaffUserSessionRow,
} from '@/types/staff-users'

async function fetchApprovedMentorIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Set<string>> {
  const { data } = await supabase.from('mentor_profiles').select('user_id').eq('status', 'approved')
  return new Set((data ?? []).map((row) => row.user_id))
}

async function fetchEmailMap(userIds: string[]): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>()
  if (userIds.length === 0) return map

  try {
    const admin = createAdminClient()
    const results = await Promise.all(
      userIds.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id)
        return [id, data.user?.email ?? null] as const
      }),
    )
    for (const [id, email] of results) map.set(id, email)
  } catch {
    // email optional when service role unavailable
  }

  return map
}

function displayRole(userId: string, mentorIds: Set<string>): 'individual' | 'mentor' {
  return mentorIds.has(userId) ? 'mentor' : 'individual'
}

/** Section 8 — bounded list: profiles.role = individual only; mentor is a display filter. */
export async function fetchStaffUsersList(
  filters: StaffUsersListFilters = {},
): Promise<StaffUsersListResult> {
  await requireStaffShellAccess()
  const supabase = await createClient()
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = STAFF_USERS_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const mentorIds = await fetchApprovedMentorIds(supabase)
  const roleFilter = filters.role ?? 'all'

  let query = supabase
    .from('profiles')
    .select('id, full_name, role, created_at, last_login_at, suspended_at', { count: 'exact' })
    .eq('role', 'individual')

  const q = filters.q?.trim()
  if (q) {
    query = query.ilike('full_name', `%${q.replace(/[%_\\]/g, '\\$&')}%`)
  }

  if (roleFilter === 'mentor') {
    const ids = Array.from(mentorIds)
    if (ids.length === 0) {
      return { rows: [], total: 0, page, pageSize, totalPages: 0 }
    }
    query = query.in('id', ids)
  } else if (roleFilter === 'individual' && mentorIds.size > 0) {
    query = query.not('id', 'in', `(${Array.from(mentorIds).join(',')})`)
  }

  const statusFilter = filters.status ?? 'all'
  if (statusFilter === 'active') {
    query = query.is('suspended_at', null)
  } else if (statusFilter === 'suspended') {
    query = query.not('suspended_at', 'is', null)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  const rows = data ?? []
  const emailMap = await fetchEmailMap(rows.map((row) => row.id))

  const listRows: StaffUserListRow[] = rows.map((row) => ({
    id: row.id,
    full_name: row.full_name,
    display_role: displayRole(row.id, mentorIds),
    is_suspended: Boolean(row.suspended_at),
    created_at: row.created_at,
    last_login_at: row.last_login_at,
    email: emailMap.get(row.id) ?? null,
  }))

  const total = count ?? 0
  return {
    rows: listRows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function fetchStaffUserDetail(userId: string): Promise<StaffUserDetail | null> {
  await requireStaffShellAccess()
  const supabase = await createClient()

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data || !isStaffManageableProfileRole(data.role)) return null

  const { data: mentor } = await supabase
    .from('mentor_profiles')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle()

  const emailMap = await fetchEmailMap([userId])

  return {
    id: data.id,
    full_name: data.full_name,
    email: emailMap.get(userId) ?? null,
    role: data.role,
    display_role: mentor?.status === 'approved' ? 'mentor' : 'individual',
    phone: data.phone,
    locale: data.locale,
    avatar_url: data.avatar_url,
    email_verified_at: data.email_verified_at,
    phone_verified_at: data.phone_verified_at,
    suspended_at: data.suspended_at,
    suspended_reason: data.suspended_reason,
    last_login_at: data.last_login_at,
    last_login_ip: data.last_login_ip ? String(data.last_login_ip) : null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    mentor_status: mentor?.status ?? null,
  }
}

export async function fetchStaffUserSessions(
  userId: string,
  manageable = true,
): Promise<StaffUserSessionRow[]> {
  await requireStaffShellAccess()
  if (manageable && !(await fetchStaffUserDetail(userId))) return []

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('active_sessions')
      .select(
        'id, device_label, ip_address, user_agent, last_active_at, created_at, expires_at, revoked_at',
      )
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []).map((row) => ({
      ...row,
      ip_address: row.ip_address ? String(row.ip_address) : null,
    }))
  } catch {
    const supabase = await createClient()
    const { data } = await supabase
      .from('active_sessions')
      .select(
        'id, device_label, ip_address, user_agent, last_active_at, created_at, expires_at, revoked_at',
      )
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false })
    return (data ?? []).map((row) => ({
      ...row,
      ip_address: row.ip_address ? String(row.ip_address) : null,
    }))
  }
}

export async function fetchStaffUserAuditTimeline(
  userId: string,
  manageable = true,
): Promise<StaffUserAuditEvent[]> {
  await requireStaffShellAccess()
  if (manageable && !(await fetchStaffUserDetail(userId))) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audit_logs')
    .select(
      'id, action, entity_type, entity_id, actor_id, created_at, metadata, actor:profiles!audit_logs_actor_id_fkey(full_name)',
    )
    .eq('entity_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const actor = row.actor as { full_name: string | null } | null
    return {
      id: row.id,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      actor_id: row.actor_id,
      actor_name: actor?.full_name ?? null,
      created_at: row.created_at,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
    }
  })
}
