import { NextResponse } from 'next/server'
import { requireMeUserId } from '@/lib/me/account'
import { fetchMeetingForParticipant } from '@/lib/meetings/queries'

type RouteContext = { params: { id: string } }

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const userId = await requireMeUserId()
    const meeting = await fetchMeetingForParticipant(params.id, userId)
    if (!meeting) {
      return NextResponse.json({ error: 'الموعد غير موجود' }, { status: 404 })
    }
    return NextResponse.json({ meeting })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تحميل الموعد'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
