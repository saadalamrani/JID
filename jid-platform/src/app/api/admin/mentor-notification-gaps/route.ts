import { NextResponse } from 'next/server'
import { AdminAuthError, requireMentorshipStaff } from '@/lib/admin/require-mentorship-staff'
import { fetchMentorNotificationGaps } from '@/lib/admin/mentor-notification-gaps'

/** Section 4.16 — cold-start outreach gaps for staff. */
export async function GET() {
  try {
    await requireMentorshipStaff()
    const gaps = await fetchMentorNotificationGaps()
    return NextResponse.json({ gaps })
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تحميل الفجوات'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
