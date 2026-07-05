import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { SLA_HOURS, hoursSince } from '@/lib/entity/claims'

export const PENDING_CLAIM_STATUSES = ['pending', 'pending_review', 'under_review'] as const

export type ClaimQueueItem = {
  id: string
  user_id: string
  company_id: string
  company_name: string
  business_email: string
  claimant_name: string
  claimant_title: string | null
  status: string
  claim_type: 'company' | 'university'
  created_at: string
  reviewed_at: string | null
  company_domains?: string[]
}

export type ClaimsQueueStats = {
  pending: number
  overdue: number
  completedToday: number
}

type Client = SupabaseClient<Database>

export async function fetchClaimsQueue(supabase: Client): Promise<{
  claims: ClaimQueueItem[]
  stats: ClaimsQueueStats
}> {
  const { data: claims, error } = await supabase
    .from('claim_requests')
    .select(
      'id, user_id, company_id, company_name, business_email, claimant_name, claimant_title, status, claim_type, created_at, reviewed_at',
    )
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  const rows = (claims ?? []) as ClaimQueueItem[]
  const pendingRows = rows.filter((row) =>
    (PENDING_CLAIM_STATUSES as readonly string[]).includes(row.status),
  )

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const stats: ClaimsQueueStats = {
    pending: pendingRows.length,
    overdue: pendingRows.filter((row) => hoursSince(row.created_at) > SLA_HOURS).length,
    completedToday: rows.filter((row) => {
      if (!row.reviewed_at) return false
      if (!['approved', 'rejected'].includes(row.status)) return false
      return new Date(row.reviewed_at).getTime() >= todayStart.getTime()
    }).length,
  }

  return { claims: pendingRows, stats }
}

export async function fetchClaimById(
  supabase: Client,
  claimId: string,
): Promise<ClaimQueueItem | null> {
  const { data: claim, error } = await supabase
    .from('claim_requests')
    .select(
      'id, user_id, company_id, company_name, business_email, claimant_name, claimant_title, status, claim_type, created_at, reviewed_at',
    )
    .eq('id', claimId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!claim) return null

  const { data: company } = await supabase
    .from('companies')
    .select('domains')
    .eq('id', claim.company_id)
    .maybeSingle()

  return {
    ...(claim as ClaimQueueItem),
    company_domains: company?.domains ?? [],
  }
}
