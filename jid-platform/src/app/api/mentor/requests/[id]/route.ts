import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  MentorRequestReviewError,
  reviewMentorMentorshipRequest,
} from '@/lib/mentor-hub/review-request'
import { hasApprovedMentorProfile } from '@/lib/mentor-mode/has-mentor-role'
import { requireMeUserId } from '@/lib/me/account'
import { reviewMentorRequestSchema } from '@/lib/validations/mentor-hub'
import { trackServer } from '@/lib/analytics/server'

type RouteContext = { params: { id: string } }

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const mentorId = await requireMeUserId()
    const hasRole = await hasApprovedMentorProfile(mentorId)
    if (!hasRole) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = reviewMentorRequestSchema.parse(await request.json())
    const result = await reviewMentorMentorshipRequest(mentorId, params.id, body)
    await trackServer(
      body.decision === 'accept' ? 'mentorship_request_accepted' : 'mentorship_request_declined',
      mentorId,
      { request_id: params.id },
    )
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message ?? 'بيانات غير صالحة'
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    if (error instanceof MentorRequestReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تحديث الطلب'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
