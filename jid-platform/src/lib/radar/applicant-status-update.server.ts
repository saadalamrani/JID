import 'server-only'

import { createClient } from '@/lib/supabase/server'
import {
  assertApplicantRadarStatusUpdate,
  isAllowedApplicantStatusTransition,
} from '@/lib/radar/applicant-status-transitions'
import { columnForApplicationStatus } from '@/lib/radar/column-config'
import type { ApplicationStatus } from '@/types/application'
import type { RadarColumnId } from '@/lib/radar/column-config'

export class ApplicantStatusUpdateError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
  ) {
    super(message)
    this.name = 'ApplicantStatusUpdateError'
  }
}

type UpdateApplicantApplicationStatusInput = {
  applicationId: string
  status: ApplicationStatus
  fromColumn?: RadarColumnId
  toColumn?: RadarColumnId
}

/** Section 9 — server-side applicant status update (RLS + trigger enforced). */
export async function updateApplicantApplicationStatus(
  input: UpdateApplicantApplicationStatusInput,
): Promise<{ id: string; status: ApplicationStatus }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new ApplicantStatusUpdateError('Authentication required', 401)
  }

  const { data: row, error: fetchError } = await supabase
    .from('applications')
    .select('id, status, applicant_id')
    .eq('id', input.applicationId)
    .eq('applicant_id', user.id)
    .maybeSingle()

  if (fetchError) {
    throw new ApplicantStatusUpdateError(fetchError.message, 500)
  }

  if (!row) {
    throw new ApplicantStatusUpdateError('طلب التقديم غير موجود', 404)
  }

  const fromStatus = row.status as ApplicationStatus
  const toStatus = input.status

  if (!isAllowedApplicantStatusTransition(fromStatus, toStatus)) {
    throw new ApplicantStatusUpdateError('انتقال الحالة غير مسموح', 403)
  }

  if (input.fromColumn && input.toColumn) {
    assertApplicantRadarStatusUpdate({
      fromColumn: input.fromColumn,
      toColumn: input.toColumn,
      fromStatus,
      toStatus,
    })
  } else if (toStatus === 'withdrawn') {
    const fromColumn = columnForApplicationStatus(fromStatus)
    if (!fromColumn || fromColumn === 'archived' || fromColumn === 'applied') {
      throw new ApplicantStatusUpdateError('لا يمكن أرشفة هذه البطاقة يدوياً', 403)
    }
    if (fromColumn === 'under_review' && fromStatus !== 'invited') {
      throw new ApplicantStatusUpdateError('لا يمكن أرشفة هذه البطاقة يدوياً', 403)
    }
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('applications')
    .update({
      status: toStatus,
      updated_at: now,
    })
    .eq('id', input.applicationId)
    .eq('applicant_id', user.id)
    .select('id, status')
    .single()

  if (error || !data) {
    throw new ApplicantStatusUpdateError(error?.message ?? 'تعذّر تحديث الحالة', 500)
  }

  return { id: data.id, status: data.status as ApplicationStatus }
}
