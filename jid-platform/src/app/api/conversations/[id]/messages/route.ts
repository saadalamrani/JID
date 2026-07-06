import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  ConversationMessageError,
  insertEncryptedMessage,
} from '@/lib/conversations/send-message'
import { requireMeUserId } from '@/lib/me/account'
import { sendEncryptedMessageSchema } from '@/lib/validations/conversation-message'

type RouteContext = { params: { id: string } }

/** Section 5.4 — persist ciphertext + nonce only; server never accepts plaintext. */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const senderId = await requireMeUserId()
    const raw = (await request.json()) as Record<string, unknown>

    if ('plaintext' in raw || 'message' in raw || 'body' in raw) {
      return NextResponse.json({ error: 'النص العادي غير مقبول على الخادم' }, { status: 400 })
    }

    const body = sendEncryptedMessageSchema.parse(raw)
    const message = await insertEncryptedMessage(senderId, params.id, body)
    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message ?? 'بيانات غير صالحة'
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    if (error instanceof ConversationMessageError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر إرسال الرسالة'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
