import type { Database } from '@/lib/supabase/types'
import type {
  ClaimReviewDecision,
  ContentFlagTargetType,
  FlagReason,
  FlagStatus,
} from '@/lib/validations/staff'

export type ClaimRequestRow = Database['public']['Tables']['claim_requests']['Row']
export type ContentFlagRow = Database['public']['Tables']['content_flags']['Row']

export type StaffPersonalMetrics = {
  staff_user_id: string
  total_actions: number
  actions_today: number
  claims_reviewed: number
  claims_reviewed_today: number
  claims_assigned_open: number
  claims_approved_today: number
  claims_rejected_today: number
  avg_review_hours_7d: number
  flags_resolved: number
  flags_resolved_today: number
}

export type StaffDashboardClaimRow = {
  id: string
  company_name: string
  claimant_name: string
  status: string
  sla_due_at: string | null
  created_at: string
  claim_type: string
}

export type ReviewClaimRpcInput = {
  claimId: string
  decision: ClaimReviewDecision
  reason: string
  requiredDocuments?: string[]
}

export type ContentFlagCreateInput = {
  targetType: ContentFlagTargetType
  targetId: string
  reason: FlagReason
  details?: string
}

export type ContentFlagResolveInput = {
  flagId: string
  status: Extract<FlagStatus, 'resolved' | 'dismissed'>
  resolutionNotes: string
}
