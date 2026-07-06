import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { isPrivilegedStaffRole } from '@/lib/profile/visibility-rules'
import { isUserRole, PRIVILEGED_STAFF_ROLES, type UserRole } from '@/lib/auth/rbac'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

export type TriageViewer = {
  userId: string
  role: UserRole
  isStaff: boolean
  companyId: string | null
}

export type TriageJobRef = {
  id: string
  company_id: string
  title_ar: string
  title_en: string | null
  application_deadline: string
  applicant_count: number
}

export async function getTriageViewer(client?: Client): Promise<TriageViewer | null> {
  const supabase = client ?? (await createClient())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role: UserRole | null =
    profileRow?.role && isUserRole(profileRow.role) ? profileRow.role : null
  if (!role) return null

  const isStaff = (PRIVILEGED_STAFF_ROLES as readonly string[]).includes(role)

  let companyId: string | null = null
  if (!isStaff) {
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('claimed_by', user.id)
      .eq('entity_state', 'approved')
      .maybeSingle()
    companyId = company?.id ?? null
  }

  return { userId: user.id, role, isStaff, companyId }
}

export async function fetchTriageJob(
  jobId: string,
  client?: Client,
): Promise<TriageJobRef | null> {
  const supabase = client ?? (await createClient())
  const { data, error } = await supabase
    .from('jobs')
    .select('id, company_id, title_ar, title_en, application_deadline, applicant_count')
    .eq('id', jobId)
    .maybeSingle()

  if (error || !data) return null
  return data
}

/**
 * Server-side gate for applicant triage (Sections 5.1–5.3).
 * Company: own jobs only + entity_state approved. Staff/super_admin: any job.
 */
export async function assertJobTriageAccess(jobId: string): Promise<{
  viewer: TriageViewer
  job: TriageJobRef
}> {
  const supabase = await createClient()
  const viewer = await getTriageViewer(supabase)

  if (!viewer) {
    throw new TriageAccessError('غير مصرح', 401)
  }

  const job = await fetchTriageJob(jobId, supabase)
  if (!job) {
    throw new TriageAccessError('الفرصة غير موجودة', 404)
  }

  if (viewer.isStaff || isPrivilegedStaffRole(viewer.role)) {
    return { viewer, job }
  }

  if (!viewer.companyId || viewer.companyId !== job.company_id) {
    throw new TriageAccessError('غير مصرح لك بعرض متقدمي هذه الفرصة', 403)
  }

  return { viewer, job }
}

export class TriageAccessError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'TriageAccessError'
    this.status = status
  }
}
