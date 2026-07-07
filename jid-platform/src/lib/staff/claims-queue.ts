import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import { resolveSlaDueAt } from '@/lib/staff/claim-urgency'
import { PENDING_CLAIM_STATUSES } from '@/lib/staff/claims'
import { listPendingMentorApplications } from '@/lib/staff/mentor-applications'

export type StaffQueueItemType = 'company' | 'university' | 'mentor'

export type StaffClaimsQueueItem = {
  id: string
  queueType: StaffQueueItemType
  applicantName: string
  targetEntityName: string
  submittedAt: string
  slaDueAt: string
  assignedStaffId: string | null
  status: string
  href: string
}

type ClaimRow = {
  id: string
  claimant_name: string
  company_name: string
  claim_type: string
  created_at: string
  sla_due_at: string | null
  assigned_staff_id: string | null
  status: string
}

type ReviewedClaimRow = ClaimRow & {
  reviewed_at: string | null
}

function mapClaimRow(row: ClaimRow): StaffClaimsQueueItem {
  const queueType = row.claim_type === 'university' ? 'university' : 'company'
  return {
    id: row.id,
    queueType,
    applicantName: row.claimant_name,
    targetEntityName: row.company_name,
    submittedAt: row.created_at,
    slaDueAt: resolveSlaDueAt(row.sla_due_at, row.created_at),
    assignedStaffId: row.assigned_staff_id,
    status: row.status,
    href: `/staff/claims/${row.id}`,
  }
}

function mapMentorRow(application: Awaited<
  ReturnType<typeof listPendingMentorApplications>
>['applications'][number]): StaffClaimsQueueItem {
  const submittedAt = application.application_submitted_at ?? new Date().toISOString()
  return {
    id: application.user_id,
    queueType: 'mentor',
    applicantName: application.applicant_name ?? 'Unnamed applicant',
    targetEntityName: application.headline ?? application.expertise_areas[0] ?? 'Mentor application',
    submittedAt,
    slaDueAt: resolveSlaDueAt(null, submittedAt),
    assignedStaffId: null,
    status: application.status,
    href: `/staff/mentor-applications/${application.user_id}`,
  }
}

function sortBySla(items: StaffClaimsQueueItem[]): StaffClaimsQueueItem[] {
  return [...items].sort(
    (a, b) => new Date(a.slaDueAt).getTime() - new Date(b.slaDueAt).getTime(),
  )
}

/** Section 7.2 — unified pending queue (claims + mentor applications), top N by SLA. */
export async function fetchPendingClaimsQueue(limit = 100): Promise<StaffClaimsQueueItem[]> {
  const supabase = await createClient()

  const [claimsResult, mentorResult] = await Promise.all([
    supabase
      .from('claim_requests')
      .select(
        'id, claimant_name, company_name, claim_type, created_at, sla_due_at, assigned_staff_id, status',
      )
      .in('status', [...PENDING_CLAIM_STATUSES])
      .order('sla_due_at', { ascending: true, nullsFirst: false })
      .limit(limit),
    listPendingMentorApplications(),
  ])

  if (claimsResult.error) throw new Error(claimsResult.error.message)

  const claimItems = ((claimsResult.data ?? []) as ClaimRow[]).map(mapClaimRow)
  const mentorItems = mentorResult.applications.map(mapMentorRow)

  return sortBySla([...claimItems, ...mentorItems]).slice(0, limit)
}

/** Section 7.2 — claims assigned to the current staff member. */
export async function fetchMyAssignedClaimsQueue(limit = 100): Promise<StaffClaimsQueueItem[]> {
  const profile = await requireStaffShellAccess()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('claim_requests')
    .select(
      'id, claimant_name, company_name, claim_type, created_at, sla_due_at, assigned_staff_id, status',
    )
    .eq('assigned_staff_id', profile.id)
    .in('status', [...PENDING_CLAIM_STATUSES])
    .order('sla_due_at', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return ((data ?? []) as ClaimRow[]).map(mapClaimRow)
}

/** Section 7.2 — claims previously reviewed by the current staff member. */
export async function fetchMyClaimsHistory(limit = 100): Promise<StaffClaimsQueueItem[]> {
  const profile = await requireStaffShellAccess()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('claim_requests')
    .select(
      'id, claimant_name, company_name, claim_type, created_at, sla_due_at, assigned_staff_id, status, reviewed_at',
    )
    .eq('reviewed_by', profile.id)
    .in('status', ['approved', 'rejected'])
    .order('reviewed_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return ((data ?? []) as ReviewedClaimRow[]).map((row) => mapClaimRow(row))
}
