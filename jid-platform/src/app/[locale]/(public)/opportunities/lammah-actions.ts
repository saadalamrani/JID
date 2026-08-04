'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

type UntypedClient = SupabaseClient<Record<string, unknown>>

export type ReportLammahProblemResult = { ok: true } | { ok: false; error: string }

export async function reportLammahProblem(
  opportunityId: string,
): Promise<ReportLammahProblemResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(opportunityId)) {
    return { ok: false, error: 'invalid_opportunity' }
  }
  const client = (await createClient()) as unknown as UntypedClient
  const { data, error } = await client.rpc('report_lammah_problem', {
    p_opportunity_id: opportunityId,
    p_reason: 'User requested Staff review from the published Lammah card',
  })
  if (error) return { ok: false, error: 'report_failed' }
  const result = data as { ok?: boolean; code?: string } | null
  return result?.ok === true ? { ok: true } : { ok: false, error: result?.code ?? 'report_failed' }
}
