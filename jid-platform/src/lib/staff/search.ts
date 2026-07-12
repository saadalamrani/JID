import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { StaffSearchResponse } from '@/types/staff-search'

const RESULT_LIMIT = 8
const MIN_QUERY_LENGTH = 2

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

/**
 * Section 12 — bounded staff directory search.
 * Users: individuals (+ mentors) only — never staff/admin/super_admin.
 * Entities: companies/universities in approved or pending_review states.
 * Claims: pending claim requests by company/claimant/email.
 * Does NOT query feature_flags, platform_config, or emergency_actions.
 */
export async function searchStaffDirectory(query: string): Promise<StaffSearchResponse> {
  const trimmed = query.trim()
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return { users: [], entities: [], claims: [] }
  }

  const pattern = `%${escapeIlike(trimmed)}%`
  const supabase = await createClient()

  const [usersResult, entitiesResult, claimsResult, mentorRows] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'individual')
      .ilike('full_name', pattern)
      .order('full_name', { ascending: true })
      .limit(RESULT_LIMIT),
    supabase
      .from('companies')
      .select('id, name, name_ar, entity_type, entity_state')
      .in('entity_state', ['approved', 'pending_review'])
      .or(`name.ilike.${pattern},name_ar.ilike.${pattern}`)
      .order('name', { ascending: true })
      .limit(RESULT_LIMIT),
    supabase
      .from('verification_requests')
      .select('id, company_name, claimant_name, business_email, status')
      .in('status', ['pending', 'submitted', 'pending_review', 'under_review'])
      .or(
        `company_name.ilike.${pattern},claimant_name.ilike.${pattern},business_email.ilike.${pattern}`,
      )
      .order('created_at', { ascending: true })
      .limit(RESULT_LIMIT),
    supabase.from('mentor_profiles').select('user_id').eq('status', 'approved'),
  ])

  const mentorIds = new Set((mentorRows.data ?? []).map((row) => row.user_id))

  const users =
    usersResult.data?.map((row) => {
      const isMentor = mentorIds.has(row.id)
      return {
        id: row.id,
        label: row.full_name?.trim() || 'Unnamed user',
        subtitle: isMentor ? 'mentor' : 'individual',
        href: `/u/${row.id}`,
      }
    }) ?? []

  const entities =
    entitiesResult.data?.map((row) => ({
      id: row.id,
      label: row.name_ar?.trim() || row.name,
      subtitle: `${row.entity_type} · ${row.entity_state}`,
      href: `/companies/${row.id}`,
    })) ?? []

  const claims =
    claimsResult.data?.map((row) => ({
      id: row.id,
      label: row.company_name,
      subtitle: `${row.claimant_name} · ${row.status}`,
      href: `/staff/verification/${row.id}`,
    })) ?? []

  return { users, entities, claims }
}
