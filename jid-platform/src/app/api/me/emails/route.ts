import { NextResponse } from 'next/server'
import { z } from 'zod'
import { listUserVerifiedEmails, requireMeUserId } from '@/lib/me/account'
import { sendEmailOtp } from '@/lib/verification/email-otp'
import { OtpRateLimitError } from '@/lib/verification/rate-limit'
import { addEmailSchema } from '@/lib/validations/me'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const userId = await requireMeUserId()
    const emails = await listUserVerifiedEmails(userId)
    return NextResponse.json({ emails })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تحميل البريد'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireMeUserId()
    const body = addEmailSchema.parse(await request.json())
    const supabase = await createClient()
    const result = await sendEmailOtp(supabase, body.email)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? 'بيانات غير صالحة' }, { status: 400 })
    }
    if (error instanceof OtpRateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'تعذّر إرسال رمز التحقق'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
