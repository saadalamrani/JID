import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { dispatchApplicationRejectionEmails } from '@/lib/email/dispatch-application-rejection'
import { trackServer } from '@/lib/analytics/server'
import type { ApplicationStatus } from '@/types/application'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { assertJobTriageAccess } from './triage-access'
import { getTriageViewer } from './triage-access'

type Client = SupabaseClient<Database>

const COMPANY_ACTION_STATUSES: ApplicationStatus[] = [
  'under_review',
  'shortlisted',
  'rejected',
  'invited',
]

async function verifyApplicationAccess(
  client: Client,
  applicationId: string,
): Promise<{ id: string; job_id: string; status: ApplicationStatus }> {
  const { data: application, error } = await client
    .from('applications')
    .select('id, job_id, status')
    .eq('id', applicationId)
    .maybeSingle()

  if (error || !application) {
    throw new MutationError('طلب التقديم غير موجود', 404)
  }

  if (!application.job_id) {
    throw new MutationError('طلب التقديم غير مرتبط بفرصة', 400)
  }

  await assertJobTriageAccess(application.job_id)

  return {
    id: application.id,
    job_id: application.job_id,
    status: application.status as ApplicationStatus,
  }
}

export class MutationError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'MutationError'
    this.status = status
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<{ id: string; status: ApplicationStatus }> {
  if (!COMPANY_ACTION_STATUSES.includes(status)) {
    throw new MutationError('حالة غير صالحة', 400)
  }

  const supabase = await createClient()
  const application = await verifyApplicationAccess(supabase, applicationId)

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('applications')
    .update({
      status,
      last_company_action_at: now,
      updated_at: now,
    })
    .eq('id', applicationId)
    .select('id, status')
    .single()

  if (error || !data) {
    throw new MutationError(error?.message ?? 'تعذّر تحديث الحالة', 500)
  }

  if (status === 'rejected' && application.status !== 'rejected') {
    const { data: jobRow } = await supabase
      .from('jobs')
      .select('company_id')
      .eq('id', application.job_id)
      .maybeSingle()

    let skipLegacyRejection = false
    if (jobRow?.company_id) {
      const { data: hasSmart } = await supabase.rpc('company_has_entitlement', {
        p_company_id: jobRow.company_id,
        p_feature: 'smart_communication',
      })
      skipLegacyRejection = Boolean(hasSmart)
    }

    if (!skipLegacyRejection) {
      await dispatchApplicationRejectionEmails(supabase, [applicationId])
    }
  }

  const viewer = await getTriageViewer(supabase)
  if (viewer) {
    void trackServer('job_status_changed', viewer.userId, {
      application_id: applicationId,
      from: application.status,
      to: status,
    })
  }

  return { id: data.id, status: data.status as ApplicationStatus }
}

export async function bulkUpdateApplicationStatuses(
  applicationIds: string[],
  status: ApplicationStatus,
): Promise<{ updated: number; rejectedQueued: number }> {
  if (!applicationIds.length) {
    throw new MutationError('لم يتم تحديد أي طلبات', 400)
  }

  if (!COMPANY_ACTION_STATUSES.includes(status)) {
    throw new MutationError('حالة غير صالحة', 400)
  }

  const supabase = await createClient()
  const uniqueIds = Array.from(new Set(applicationIds))

  const { data: rows, error: fetchError } = await supabase
    .from('applications')
    .select('id, job_id, status')
    .in('id', uniqueIds)

  if (fetchError) {
    throw new MutationError(fetchError.message, 500)
  }

  if (!rows?.length) {
    throw new MutationError('طلبات التقديم غير موجودة', 404)
  }

  const jobIds = Array.from(
    new Set(rows.map((row) => row.job_id).filter((jobId): jobId is string => Boolean(jobId))),
  )
  for (const jobId of jobIds) {
    await assertJobTriageAccess(jobId)
  }

  const now = new Date().toISOString()
  const { data: updatedRows, error: updateError } = await supabase
    .from('applications')
    .update({
      status,
      last_company_action_at: now,
      updated_at: now,
    })
    .in('id', uniqueIds)
    .select('id, status')

  if (updateError) {
    throw new MutationError(updateError.message, 500)
  }

  let rejectedQueued = 0
  if (status === 'rejected') {
    const toQueue = (rows ?? [])
      .filter((row) => row.status !== 'rejected')
      .map((row) => row.id)

    if (toQueue.length) {
      const firstJobId = jobIds[0]
      const companyId =
        jobIds.length === 1 && firstJobId
          ? (
              await supabase.from('jobs').select('company_id').eq('id', firstJobId).maybeSingle()
            ).data?.company_id
          : null

      let skipLegacyRejection = false
      if (companyId) {
        const { data: hasSmart } = await supabase.rpc('company_has_entitlement', {
          p_company_id: companyId,
          p_feature: 'smart_communication',
        })
        skipLegacyRejection = Boolean(hasSmart)
      }

      if (!skipLegacyRejection) {
        const result = await dispatchApplicationRejectionEmails(supabase, toQueue)
        rejectedQueued = result.queued
      }
    }
  }

  const viewer = await getTriageViewer(supabase)
  if (viewer) {
    void trackServer('job_status_changed', viewer.userId, {
      application_ids: uniqueIds,
      to: status,
      bulk: true,
    })
  }

  return { updated: updatedRows?.length ?? 0, rejectedQueued }
}
