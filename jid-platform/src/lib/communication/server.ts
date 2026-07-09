import 'server-only'

import { createClient } from '@/lib/supabase/server'

export async function fetchJobAutoReplyEnabledServer(jobId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('job_auto_reply_enabled', {
    p_job_id: jobId,
  })

  if (error) return false
  return Boolean(data)
}

export async function companyHasSmartCommunication(companyId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('company_has_entitlement', {
    p_company_id: companyId,
    p_feature: 'smart_communication',
  })

  if (error) return false
  return Boolean(data)
}
