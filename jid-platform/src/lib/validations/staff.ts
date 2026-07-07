import { z } from 'zod'

export const CLAIM_REVIEW_DECISIONS = ['approved', 'rejected', 'needs_more_info'] as const
export type ClaimReviewDecision = (typeof CLAIM_REVIEW_DECISIONS)[number]

/** Maps UI decision labels to review_claim RPC values. */
export const CLAIM_REVIEW_RPC_DECISION: Record<
  ClaimReviewDecision,
  'approve' | 'reject' | 'needs_more_info'
> = {
  approved: 'approve',
  rejected: 'reject',
  needs_more_info: 'needs_more_info',
}

export const REQUIRED_CLAIM_DOCUMENTS = [
  'commercial_registry',
  'domain_ownership_proof',
  'authorization_letter',
] as const

export const reviewClaimSchema = z
  .object({
    claimId: z.string().uuid({ message: 'staff.validation.claimIdInvalid' }),
    decision: z.enum(CLAIM_REVIEW_DECISIONS, {
      message: 'staff.validation.decisionInvalid',
    }),
    reason: z
      .string()
      .trim()
      .min(10, { message: 'staff.validation.reasonMin' }),
    requiredDocuments: z
      .array(z.enum(REQUIRED_CLAIM_DOCUMENTS))
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.decision === 'rejected' && (!value.requiredDocuments || value.requiredDocuments.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'staff.validation.requiredDocumentsMin',
        path: ['requiredDocuments'],
      })
    }
  })

export type ReviewClaimInput = z.infer<typeof reviewClaimSchema>

export const FLAG_REASONS = [
  'spam',
  'harassment',
  'hate_speech',
  'inappropriate_content',
  'misinformation',
  'impersonation',
  'copyright_violation',
  'privacy_violation',
  'other',
] as const

export type FlagReason = (typeof FLAG_REASONS)[number]

export const FLAG_STATUSES = ['pending', 'under_review', 'resolved', 'dismissed'] as const
export type FlagStatus = (typeof FLAG_STATUSES)[number]

export const CONTENT_FLAG_TARGETS = [
  'profile',
  'job',
  'company',
  'mentor_profile',
  'announcement',
  'message',
] as const

export type ContentFlagTargetType = (typeof CONTENT_FLAG_TARGETS)[number]

export const createContentFlagSchema = z.object({
  targetType: z.enum(CONTENT_FLAG_TARGETS, {
    message: 'staff.validation.flagTargetInvalid',
  }),
  targetId: z.string().uuid({ message: 'staff.validation.targetIdInvalid' }),
  reason: z.enum(FLAG_REASONS, { message: 'staff.validation.flagReasonInvalid' }),
  details: z
    .string()
    .trim()
    .max(1000, { message: 'staff.validation.flagDetailsMax' })
    .optional(),
})

export type CreateContentFlagInput = z.infer<typeof createContentFlagSchema>

export const resolveContentFlagSchema = z.object({
  flagId: z.string().uuid({ message: 'staff.validation.flagIdInvalid' }),
  status: z.enum(['resolved', 'dismissed'] as const, {
    message: 'staff.validation.flagStatusInvalid',
  }),
  resolutionNotes: z
    .string()
    .trim()
    .min(3, { message: 'staff.validation.resolutionNotesMin' })
    .max(1000, { message: 'staff.validation.resolutionNotesMax' }),
})

export type ResolveContentFlagInput = z.infer<typeof resolveContentFlagSchema>

export const staffSuspendUserSchema = z.object({
  userId: z.string().uuid({ message: 'staff.validation.userIdInvalid' }),
  reason: z
    .string()
    .trim()
    .min(3, { message: 'staff.validation.suspendReasonMin' }),
})

export type StaffSuspendUserInput = z.infer<typeof staffSuspendUserSchema>
