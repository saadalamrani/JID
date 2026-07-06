import { NextResponse } from 'next/server'
import { z } from 'zod'
import { MentorSettingsError, updateMentorHubSettings } from '@/lib/mentor-hub/update-settings'
import { hasApprovedMentorProfile } from '@/lib/mentor-mode/has-mentor-role'
import { requireMeUserId } from '@/lib/me/account'
import { mentorHubSettingsSchema } from '@/lib/validations/mentor-hub'

export async function PATCH(request: Request) {
  try {
    const mentorId = await requireMeUserId()
    const hasRole = await hasApprovedMentorProfile(mentorId)
    if (!hasRole) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = mentorHubSettingsSchema.parse(await request.json())
    const settings = await updateMentorHubSettings(mentorId, body)
    return NextResponse.json({ settings })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message ?? 'بيانات غير صالحة'
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    if (error instanceof MentorSettingsError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر حفظ الإعدادات'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
