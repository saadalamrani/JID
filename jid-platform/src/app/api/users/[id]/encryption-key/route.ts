import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireMeUserId } from '@/lib/me/account'
import { createClient } from '@/lib/supabase/server'

type RouteContext = { params: { id: string } }

const userIdSchema = z.string().uuid()

/** Section 5.4 — fetch another user's public encryption key for outbound messages. */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireMeUserId()
    const targetUserId = userIdSchema.parse(params.id)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_encryption_keys')
      .select('user_id, public_key, key_version')
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'المفتاح غير موجود' }, { status: 404 })

    return NextResponse.json({
      user_id: data.user_id,
      public_key: data.public_key,
      key_version: data.key_version,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'معرّف مستخدم غير صالح' }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    return NextResponse.json({ error: 'تعذّر تحميل المفتاح' }, { status: 500 })
  }
}
