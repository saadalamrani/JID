import { NextResponse } from 'next/server'
import { requireMeUserId } from '@/lib/me/account'
import {
  MeetingFeedbackDismissError,
  dismissMeetingFeedbackPrompt,
} from '@/lib/meetings/dismiss-feedback'

type RouteContext = { params: { id: string } }

/** Section 8.5 — dismiss feedback prompt (snooze 24h). */
export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const userId = await requireMeUserId()
    const meeting = await dismissMeetingFeedbackPrompt(params.id, userId)
    return NextResponse.json({ meeting })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    if (error instanceof MeetingFeedbackDismissError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تأجيل التقييم'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
