import { NextResponse } from 'next/server'
import { fetchMenteeSnapshotForUser } from '@/lib/mentorship/mentee-snapshot'
import { requireMeUserId } from '@/lib/me/account'

export async function GET() {
  try {
    const userId = await requireMeUserId()
    const snapshot = await fetchMenteeSnapshotForUser(userId)
    if (!snapshot) {
      return NextResponse.json({ error: 'تعذّر تحميل ملفك الشخصي' }, { status: 404 })
    }
    return NextResponse.json({ snapshot })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تحميل الملف'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
