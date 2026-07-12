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
  claim_type: 'business' | 'university'
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
    .from('verification_requests')
    .select(
      'id, applicant_user_id, directory_id, company_name, business_email, claimant_name, claimant_title, status, verification_type, created_at, reviewed_at',
    )
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  const rows = (claims ?? []).map((row) => ({
    id: row.id,
    user_id: row.applicant_user_id,
    company_id: row.directory_id,
    company_name: row.company_name,
    business_email: row.business_email,
    claimant_name: row.claimant_name,
    claimant_title: row.claimant_title,
    status: row.status,
    claim_type: row.verification_type as 'business' | 'university',
    created_at: row.created_at,
    reviewed_at: row.reviewed_at,
  })) as ClaimQueueItem[]
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
    .from('verification_requests')
    .select(
      'id, applicant_user_id, directory_id, company_name, business_email, claimant_name, claimant_title, status, verification_type, created_at, reviewed_at',
    )
    .eq('id', claimId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!claim) return null

  const { data: company } = await supabase
    .from('companies')
    .select('domains')
    .eq('id', claim.directory_id)
    .maybeSingle()

  return {
    id: claim.id,
    user_id: claim.applicant_user_id,
    company_id: claim.directory_id,
    company_name: claim.company_name,
    business_email: claim.business_email,
    claimant_name: claim.claimant_name,
    claimant_title: claim.claimant_title,
    status: claim.status,
    claim_type: claim.verification_type as 'business' | 'university',
    created_at: claim.created_at,
    reviewed_at: claim.reviewed_at,
    company_domains: company?.domains ?? [],
  }
}
