import { NextResponse } from 'next/server'
import { fetchMentorPendingRequests } from '@/lib/mentorship/queries'
import { requireMeUserId } from '@/lib/me/account'
import { createClient } from '@/lib/supabase/server'

/** Section 4.8 / Day 8 — mentor pending request queue. */
export async function GET() {
  try {
    const userId = await requireMeUserId()
    const supabase = await createClient()

    const { data: mentorProfile } = await supabase
      .from('mentor_profiles')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle()

    if (!mentorProfile || mentorProfile.status !== 'approved') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const requests = await fetchMentorPendingRequests(userId)
    return NextResponse.json({ requests })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تحميل الطلبات'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
