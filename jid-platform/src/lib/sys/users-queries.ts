import 'server-only'

import type { UserRole } from '@/lib/auth/rbac'
import { isUserRole } from '@/lib/auth/rbac'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type {
  SysUserAuditEvent,
  SysUserDetail,
  SysUserListRow,
  SysUsersListFilters,
  SysUsersListResult,
  SysUserSessionRow,
} from '@/types/sys-users'
import { SYS_USERS_PAGE_SIZE } from '@/types/sys-users'

function displayRole(role: UserRole, isApprovedMentor: boolean): string {
  if (isApprovedMentor) return 'mentor'
  return role
}

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

export async function fetchSysUsersList(
  filters: SysUsersListFilters = {},
): Promise<SysUsersListResult> {
  const supabase = await createClient()
  const page = Math.max(1, filters.page ?? 1)
  const sort = filters.sort ?? 'created_at'
  const dir = filters.dir ?? 'desc'
  const pageSize = SYS_USERS_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const mentorIds = await fetchApprovedMentorIds(supabase)

  let query = supabase.from('profiles').select(
    'id, full_name, role, created_at, last_login_at, suspended_at',
    { count: 'exact' },
  )

  const q = filters.q?.trim()
  if (q) {
    query = query.ilike('full_name', `%${q.replace(/[%_\\]/g, '\\$&')}%`)
  }

  const roleFilter = filters.role ?? 'all'
  if (roleFilter === 'mentor') {
    const ids = Array.from(mentorIds)
    if (ids.length === 0) {
      return { rows: [], total: 0, page, pageSize, totalPages: 0 }
    }
    query = query.in('id', ids)
  } else if (roleFilter === 'individual') {
    query = query.eq('role', 'individual')
    if (mentorIds.size > 0) {
      query = query.not('id', 'in', `(${Array.from(mentorIds).join(',')})`)
    }
  } else if (roleFilter !== 'all' && isUserRole(roleFilter)) {
    query = query.eq('role', roleFilter)
  }

  const statusFilter = filters.status ?? 'all'
  if (statusFilter === 'active') {
    query = query.is('suspended_at', null)
  } else if (statusFilter === 'suspended') {
    query = query.not('suspended_at', 'is', null)
  }

  if (sort === 'status') {
    query = query.order('suspended_at', { ascending: dir === 'asc', nullsFirst: dir === 'asc' })
  } else if (sort === 'full_name' || sort === 'role' || sort === 'created_at' || sort === 'last_login_at') {
    query = query.order(sort, { ascending: dir === 'asc', nullsFirst: true })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  const rows = data ?? []
  const emailMap = await fetchEmailMap(rows.map((row) => row.id))

  const listRows: SysUserListRow[] = rows.map((row) => {
    const role = row.role as UserRole
    const isMentor = mentorIds.has(row.id)
    return {
      id: row.id,
      full_name: row.full_name,
      role,
      display_role: displayRole(role, isMentor),
      is_suspended: Boolean(row.suspended_at),
      created_at: row.created_at,
      last_login_at: row.last_login_at,
      email: emailMap.get(row.id) ?? null,
    }
  })

  const total = count ?? 0
  return {
    rows: listRows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function fetchSysUserDetail(userId: string): Promise<SysUserDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null

  const { data: mentor } = await supabase
    .from('mentor_profiles')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle()

  const emailMap = await fetchEmailMap([userId])
  const role = data.role as UserRole
  const isMentor = mentor?.status === 'approved'

  return {
    id: data.id,
    full_name: data.full_name,
    email: emailMap.get(userId) ?? null,
    role,
    display_role: displayRole(role, isMentor),
    phone: data.phone,
    locale: data.locale,
    avatar_url: data.avatar_url,
    mfa_enabled: data.mfa_enabled,
    mfa_enforced: data.mfa_enforced,
    email_verified_at: data.email_verified_at,
    phone_verified_at: data.phone_verified_at,
    failed_login_count: data.failed_login_count,
    locked_until: data.locked_until,
    suspended_at: data.suspended_at,
    suspended_reason: data.suspended_reason,
    last_login_at: data.last_login_at,
    last_login_ip: data.last_login_ip ? String(data.last_login_ip) : null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    mentor_status: mentor?.status ?? null,
  }
}

export async function fetchSysUserSessions(userId: string): Promise<SysUserSessionRow[]> {
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

/** Section 8.2 — audit events where entity_id = user (target resource). */
export async function fetchSysUserAuditTimeline(userId: string): Promise<SysUserAuditEvent[]> {
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
