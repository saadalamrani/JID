import 'server-only'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { notifyMentorApplicationApproved } from '@/lib/mentor-application/notify-application-approved'
import { getMentorApplicationByUserId } from '@/lib/staff/mentor-applications'

export const reviewMentorApplicationSchema = z
  .object({
    decision: z.enum(['approve', 'reject']),
    review_notes: z.string().trim().min(1, 'ملاحظات المراجعة مطلوبة'),
    rejection_reason: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === 'reject' && !data.rejection_reason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'سبب الرفض مطلوب',
        path: ['rejection_reason'],
      })
    }
  })

export type ReviewMentorApplicationInput = z.infer<typeof reviewMentorApplicationSchema>

export class MentorReviewError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'MentorReviewError'
    this.status = status
  }
}

export async function reviewMentorApplication(
  staffUserId: string,
  applicantUserId: string,
  input: ReviewMentorApplicationInput,
) {
  const application = await getMentorApplicationByUserId(applicantUserId)
  if (!application) {
    throw new MentorReviewError('طلب المرشد غير موجود', 404)
  }
  if (application.status !== 'pending_review') {
    throw new MentorReviewError('الطلب ليس قيد المراجعة', 409)
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  if (input.decision === 'approve') {
    const { data, error } = await supabase
      .from('mentor_profiles')
      .update({
        status: 'approved',
        reviewed_by: staffUserId,
        reviewed_at: now,
        rejection_reason: null,
        is_accepting_requests: true,
      })
      .eq('user_id', applicantUserId)
      .eq('status', 'pending_review')
      .select('user_id, slug, status')
      .maybeSingle()

    if (error || !data) {
      throw new MentorReviewError(error?.message ?? 'تعذّر اعتماد الطلب', 500)
    }

    await notifyMentorApplicationApproved(supabase, {
      userId: applicantUserId,
      slug: data.slug,
      reviewNotes: input.review_notes,
    })

    return data
  }

  const { data, error } = await supabase
    .from('mentor_profiles')
    .update({
      status: 'rejected',
      reviewed_by: staffUserId,
      reviewed_at: now,
      rejection_reason: input.rejection_reason!.trim(),
      is_accepting_requests: false,
    })
    .eq('user_id', applicantUserId)
    .eq('status', 'pending_review')
    .select('user_id, slug, status')
    .maybeSingle()

  if (error || !data) {
    throw new MentorReviewError(error?.message ?? 'تعذّر رفض الطلب', 500)
  }

  return data
}
