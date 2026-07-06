import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireMeUserId } from '@/lib/me/account'
import { MeetingFeedbackError, submitMeetingFeedback } from '@/lib/meetings/submit-feedback'
import { submitMeetingFeedbackSchema } from '@/lib/validations/meeting'
import { trackServer } from '@/lib/analytics/server'

type RouteContext = { params: { id: string } }

/** Section 4.14 — mentee feedback; triggers update_mentor_stats_on_meeting(). */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const userId = await requireMeUserId()
    const raw = (await request.json()) as Record<string, unknown>
    const body = submitMeetingFeedbackSchema.parse(raw)
    const meeting = await submitMeetingFeedback(params.id, userId, body)
    await trackServer('meeting_feedback_submitted', userId, {
      meeting_id: meeting.id,
      rating: body.feedback_rating,
    })
    return NextResponse.json({ meeting })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message ?? 'بيانات غير صالحة'
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    if (error instanceof MeetingFeedbackError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر حفظ التقييم'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
