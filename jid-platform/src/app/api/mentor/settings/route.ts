import { NextResponse } from 'next/server'
import { z } from 'zod'
import { markMentorSetupComplete } from '@/lib/mentor-hub/mark-setup-complete'
import { MentorSettingsError, updateMentorHubSettings } from '@/lib/mentor-hub/update-settings'
import { hasApprovedMentorProfile } from '@/lib/mentor-mode/has-mentor-role'
import { requireMeUserId } from '@/lib/me/account'
import { mentorHubSettingsSchema } from '@/lib/validations/mentor-hub'

const mentorHubPatchSchema = mentorHubSettingsSchema

export async function PATCH(request: Request) {
  try {
    const mentorId = await requireMeUserId()
    const hasRole = await hasApprovedMentorProfile(mentorId)
    if (!hasRole) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = mentorHubPatchSchema.parse(await request.json())
    const { finalize_mentor_setup, ...settingsInput } = body
    const settings = await updateMentorHubSettings(mentorId, settingsInput)

    if (finalize_mentor_setup) {
      await markMentorSetupComplete(mentorId)
    }

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
