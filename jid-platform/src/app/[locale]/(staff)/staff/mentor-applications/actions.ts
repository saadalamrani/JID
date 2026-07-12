'use server'

import { revalidatePath } from 'next/cache'
import { trackServer } from '@/lib/analytics/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import {
  MentorReviewError,
  reviewMentorApplication,
  reviewMentorApplicationSchema,
  type ReviewMentorApplicationInput,
} from '@/lib/staff/review-mentor-application'

export type ReviewMentorApplicationActionResult =
  | { ok: true }
  | { ok: false; error: string }

function revalidateMentorPaths(applicantUserId: string) {
  revalidatePath('/staff/mentor-applications')
  revalidatePath('/staff')
  revalidatePath(`/staff/mentor-applications/${applicantUserId}`)
  revalidatePath('/staff/verification')
}

export async function reviewMentorApplicationAction(
  applicantUserId: string,
  input: ReviewMentorApplicationInput,
): Promise<ReviewMentorApplicationActionResult> {
  try {
    const staff = await requireStaffShellAccess()
    if (staff.id === applicantUserId) {
      return { ok: false, error: 'Cannot review your own mentor application' }
    }

    const parsed = reviewMentorApplicationSchema.safeParse(input)
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? 'Invalid review payload'
      return { ok: false, error: message }
    }

    await reviewMentorApplication(staff.id, applicantUserId, parsed.data)
    await trackServer('staff.mentor_application_reviewed', staff.id, {
      applicant_user_id: applicantUserId,
      decision: parsed.data.decision,
    })
    revalidateMentorPaths(applicantUserId)
    return { ok: true }
  } catch (error) {
    if (error instanceof MentorReviewError) {
      return { ok: false, error: error.message }
    }
    const message = error instanceof Error ? error.message : 'Review failed'
    return { ok: false, error: message }
  }
}
