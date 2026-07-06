import { NextResponse } from 'next/server'
import { z } from 'zod'
import { submitMentorshipRequest } from '@/lib/mentorship/submit-mentorship-request'
import { requireMeUserId } from '@/lib/me/account'
import { createMentorshipRequestSchema } from '@/lib/validations/mentorship-request'
import { trackServer } from '@/lib/analytics/server'

export async function POST(request: Request) {
  try {
    const menteeId = await requireMeUserId()
    const body = createMentorshipRequestSchema.parse(await request.json())
    const result = await submitMentorshipRequest(menteeId, body)
    await trackServer('mentorship_request_submitted', menteeId, {
      mentor_id: body.mentor_id,
      request_id: result.id,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message ?? 'بيانات غير صالحة'
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'تعذّر إرسال الطلب'
    const status =
      message.includes('بالفعل') ? 409 : message.includes('لا يقبل') || message.includes('غير متاح') ? 422 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
