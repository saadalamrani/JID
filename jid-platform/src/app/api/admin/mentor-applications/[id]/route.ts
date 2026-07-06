import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireMentorshipStaff, AdminAuthError } from '@/lib/admin/require-mentorship-staff'
import {
  MentorReviewError,
  reviewMentorApplication,
  reviewMentorApplicationSchema,
} from '@/lib/staff/review-mentor-application'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireMentorshipStaff()
    const { id: applicantUserId } = await context.params
    const body = reviewMentorApplicationSchema.parse(await request.json())
    const result = await reviewMentorApplication(session.userId, applicantUserId, body)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message ?? 'بيانات غير صالحة'
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (error instanceof AdminAuthError) {
      const message = error.status === 401 ? 'غير مصرح' : 'غير مسموح'
      return NextResponse.json({ error: message }, { status: error.status })
    }
    if (error instanceof MentorReviewError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تحديث الطلب'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
