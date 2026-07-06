import { NextResponse } from 'next/server'
import { z } from 'zod'
import { submitMentorApplication } from '@/lib/mentor-application/submit'
import { requireMeUserId } from '@/lib/me/account'
import { becomeMentorSchema } from '@/lib/validations/become-mentor'

export async function POST(request: Request) {
  try {
    const userId = await requireMeUserId()
    const body = becomeMentorSchema.parse(await request.json())

    if (body.expertise_areas.length > 5) {
      return NextResponse.json({ error: 'الحد الأقصى 5 مجالات خبرة' }, { status: 400 })
    }

    const result = await submitMentorApplication(userId, body)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message ?? 'بيانات غير صالحة'
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'تعذّر إرسال الطلب'
    const status = message.includes('قائم بالفعل') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
