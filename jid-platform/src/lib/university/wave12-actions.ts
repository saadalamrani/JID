'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import type { UniversityReportPayload, UniversityReportType } from '@/types/contracts/university-reporting'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function untyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

export type Wave12ReportActionResult =
  | { ok: true; payload: UniversityReportPayload }
  | { ok: false; error: string }

export async function generateUniversityReportSnapshot(input: {
  reportType: UniversityReportType
  cohortId?: string | null
}): Promise<Wave12ReportActionResult> {
  const client = untyped(await createClient())
  const { data, error } = await client.rpc('university_report_generate', {
    p_report_type: input.reportType,
    p_cohort_id: input.cohortId ?? null,
  })
  if (error) return { ok: false, error: error.message }
  const payload = data as UniversityReportPayload
  if (!payload.ok) {
    return { ok: false, error: payload.fail_closed_reason ?? 'unauthorized' }
  }
  revalidatePath('/university/reports')
  if (payload.report_id) {
    revalidatePath(`/university/reports/${payload.report_id}`)
  }
  return { ok: true, payload }
}
