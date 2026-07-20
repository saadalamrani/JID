import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import { resolveSlaDueAt } from '@/lib/staff/verification-urgency'
import { PENDING_CLAIM_STATUSES } from '@/lib/staff/claims'
import { listPendingMentorApplications } from '@/lib/staff/mentor-applications'

export type StaffQueueItemType = 'business' | 'university' | 'mentor'

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

type VerificationRow = {
  id: string
  claimant_name: string
  company_name: string
  verification_type: string
  created_at: string
  sla_due_at: string | null
  assigned_staff_id: string | null
  status: string
}

type ReviewedVerificationRow = VerificationRow & {
  reviewed_at: string | null
}

function mapVerificationRow(row: VerificationRow): StaffClaimsQueueItem {
  const queueType = row.verification_type === 'university' ? 'university' : 'business'
  return {
    id: row.id,
    queueType,
    applicantName: row.claimant_name,
    targetEntityName: row.company_name,
    submittedAt: row.created_at,
    slaDueAt: resolveSlaDueAt(row.sla_due_at, row.created_at),
    assignedStaffId: row.assigned_staff_id,
    status: row.status,
    href: `/staff/verification/${row.id}`,
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

/** P-108 — unified pending verification queue (verification_requests + mentor applications). */
export async function fetchPendingClaimsQueue(limit = 100): Promise<StaffClaimsQueueItem[]> {
  const supabase = await createClient()

  const [verificationsResult, mentorResult] = await Promise.all([
    supabase
      .from('verification_requests')
      .select(
        'id, claimant_name, company_name, verification_type, created_at, sla_due_at, assigned_staff_id, status',
      )
      .in('status', [...PENDING_CLAIM_STATUSES])
      .order('sla_due_at', { ascending: true, nullsFirst: false })
      .limit(limit),
    listPendingMentorApplications(),
  ])

  if (verificationsResult.error) throw new Error(verificationsResult.error.message)

  const verificationItems = ((verificationsResult.data ?? []) as VerificationRow[]).map(
    mapVerificationRow,
  )
  const mentorItems = mentorResult.applications.map(mapMentorRow)

  return sortBySla([...verificationItems, ...mentorItems]).slice(0, limit)
}

/** Verification requests assigned to the current staff member. */
export async function fetchMyAssignedClaimsQueue(limit = 100): Promise<StaffClaimsQueueItem[]> {
  const profile = await requireStaffShellAccess()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('verification_requests')
    .select(
      'id, claimant_name, company_name, verification_type, created_at, sla_due_at, assigned_staff_id, status',
    )
    .eq('assigned_staff_id', profile.id)
    .in('status', [...PENDING_CLAIM_STATUSES])
    .order('sla_due_at', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return ((data ?? []) as VerificationRow[]).map(mapVerificationRow)
}

/** Verification requests previously reviewed by the current staff member. */
export async function fetchMyClaimsHistory(limit = 100): Promise<StaffClaimsQueueItem[]> {
  const profile = await requireStaffShellAccess()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('verification_requests')
    .select(
      'id, claimant_name, company_name, verification_type, created_at, sla_due_at, assigned_staff_id, status, reviewed_at',
    )
    .eq('reviewed_by', profile.id)
    .in('status', ['approved', 'rejected'])
    .order('reviewed_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return ((data ?? []) as ReviewedVerificationRow[]).map((row) => mapVerificationRow(row))
}

export type VerificationKanbanBuckets = {
  pending: StaffClaimsQueueItem[]
  overdue: StaffClaimsQueueItem[]
  completedToday: StaffClaimsQueueItem[]
}

/** Kanban columns: pending / overdue-SLA / completed-today. */
export async function fetchVerificationKanbanBuckets(): Promise<VerificationKanbanBuckets> {
  const supabase = await createClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [pendingResult, completedResult] = await Promise.all([
    fetchPendingClaimsQueue(200),
    supabase
      .from('verification_requests')
      .select(
        'id, claimant_name, company_name, verification_type, created_at, sla_due_at, assigned_staff_id, status, reviewed_at',
      )
      .in('status', ['approved', 'rejected'])
      .gte('reviewed_at', todayStart.toISOString())
      .order('reviewed_at', { ascending: false })
      .limit(50),
  ])

  if (completedResult.error) throw new Error(completedResult.error.message)

  const now = Date.now()
  const pending = pendingResult.filter((item) => item.queueType !== 'mentor')
  const overdue = pending.filter((item) => new Date(item.slaDueAt).getTime() < now)
  const pendingNotOverdue = pending.filter((item) => new Date(item.slaDueAt).getTime() >= now)

  const completedToday = ((completedResult.data ?? []) as ReviewedVerificationRow[]).map(
    mapVerificationRow,
  )

  return {
    pending: pendingNotOverdue,
    overdue,
    completedToday,
  }
}
