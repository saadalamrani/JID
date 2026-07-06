import { NextResponse } from 'next/server'
import { requireMentorshipStaff, AdminAuthError } from '@/lib/admin/require-mentorship-staff'
import { listPendingMentorApplications } from '@/lib/staff/mentor-applications'

export async function GET() {
  try {
    await requireMentorshipStaff()
    const result = await listPendingMentorApplications()
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AdminAuthError) {
      const message = error.status === 401 ? 'غير مصرح' : 'غير مسموح'
      return NextResponse.json({ error: message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تحميل الطلبات'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
