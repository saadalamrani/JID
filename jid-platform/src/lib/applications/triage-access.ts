import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { isUserRole, PRIVILEGED_STAFF_ROLES, type UserRole } from '@/lib/auth/rbac'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import {
  decideJobTriageAccess,
  type TriageJobRef,
  type TriageViewer,
} from './triage-access-decision'

export type { TriageJobRef, TriageViewer } from './triage-access-decision'
export { decideJobTriageAccess } from './triage-access-decision'

type Client = SupabaseClient<Database>

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
  if (isStaff) {
    return { userId: user.id, role, isStaff, businessProfileId: null, companyId: null }
  }

  const { data: ownedProfile } = await supabase
    .from('business_profiles')
    .select('id, directory_id, status')
    .eq('owner_user_id', user.id)
    .neq('status', 'suspended')
    .maybeSingle()

  if (ownedProfile?.id) {
    return {
      userId: user.id,
      role,
      isStaff,
      businessProfileId: ownedProfile.id,
      companyId: ownedProfile.directory_id,
    }
  }

  return {
    userId: user.id,
    role,
    isStaff,
    businessProfileId: null,
    companyId: null,
  }
}

export async function fetchTriageJob(
  jobId: string,
  client?: Client,
): Promise<TriageJobRef | null> {
  const supabase = client ?? (await createClient())
  const { data, error } = await supabase
    .from('jobs')
    .select(
      'id, company_id, business_profile_id, title_ar, title_en, application_deadline, applicant_count',
    )
    .eq('id', jobId)
    .maybeSingle()

  if (error || !data) return null
  return data
}

/**
 * Server-side gate for applicant triage.
 * Business: own jobs via owned business Profile only. Staff/super_admin: any job.
 */
export async function assertJobTriageAccess(jobId: string): Promise<{
  viewer: TriageViewer
  job: TriageJobRef
}> {
  const supabase = await createClient()
  const viewer = await getTriageViewer(supabase)
  const job = viewer ? await fetchTriageJob(jobId, supabase) : null
  const decision = decideJobTriageAccess({ viewer, job })

  if (decision === 'unauthorized') {
    throw new TriageAccessError('غير مصرح', 401)
  }
  if (decision === 'not_found' || !job || !viewer) {
    throw new TriageAccessError('الفرصة غير موجودة', 404)
  }
  if (decision === 'forbidden') {
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
