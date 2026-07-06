import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getJobPrivacySettings, requireMeUserId, updateJobPrivacySettings } from '@/lib/me/account'
import { jobPrivacySchema } from '@/lib/validations/me'

export async function GET() {
  try {
    const userId = await requireMeUserId()
    const settings = await getJobPrivacySettings(userId)
    return NextResponse.json(settings)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تحميل الإعدادات'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireMeUserId()
    const body = jobPrivacySchema.parse(await request.json())
    await updateJobPrivacySettings(userId, body)
    return NextResponse.json(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'تعذّر حفظ الإعدادات'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
