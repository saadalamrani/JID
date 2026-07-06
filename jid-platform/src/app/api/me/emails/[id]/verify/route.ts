import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireMeUserId, verifyEmailOtpAndInsert } from '@/lib/me/account'
import { verifyEmailOtpSchema } from '@/lib/validations/me'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await requireMeUserId()
    const { id: attemptId } = await context.params
    const body = verifyEmailOtpSchema.parse(await request.json())
    const email = await verifyEmailOtpAndInsert(userId, attemptId, body.otp)
    return NextResponse.json({ email })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? 'بيانات غير صالحة' }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'تعذّر التحقق'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
