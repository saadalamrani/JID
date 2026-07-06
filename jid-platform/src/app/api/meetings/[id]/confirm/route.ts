import { NextResponse } from 'next/server'
import { requireMeUserId } from '@/lib/me/account'
import { ConfirmMeetingError, confirmMeeting } from '@/lib/meetings/confirm-meeting'
import { trackServer } from '@/lib/analytics/server'

type RouteContext = { params: { id: string } }

/** Section 4.13 — mentee confirms a proposed meeting and syncs Radar. */
export async function PATCH(_request: Request, { params }: RouteContext) {
  try {
    const userId = await requireMeUserId()
    const meeting = await confirmMeeting(params.id, userId)
    await trackServer('meeting_confirmed', userId, { meeting_id: meeting.id })
    return NextResponse.json({ meeting })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    if (error instanceof ConfirmMeetingError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تأكيد الموعد'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
