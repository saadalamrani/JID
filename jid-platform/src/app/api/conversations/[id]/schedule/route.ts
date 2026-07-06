import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireMeUserId } from '@/lib/me/account'
import { ProposeMeetingError, proposeMeetingSchedule } from '@/lib/meetings/propose-schedule'
import { proposeMeetingSchema } from '@/lib/validations/meeting'
import { trackServer } from '@/lib/analytics/server'

type RouteContext = { params: { id: string } }

/** Section 4.12 — mentor proposes a meeting; creates operational schedule_proposal message. */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const mentorId = await requireMeUserId()
    const raw = (await request.json()) as Record<string, unknown>
    const body = proposeMeetingSchema.parse(raw)
    const result = await proposeMeetingSchedule(mentorId, params.id, body)
    await trackServer('meeting_proposed', mentorId, {
      conversation_id: params.id,
      meeting_id: result.meeting.id,
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
    if (error instanceof ProposeMeetingError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر اقتراح الموعد'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
