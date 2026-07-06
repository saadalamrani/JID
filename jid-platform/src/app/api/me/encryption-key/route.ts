import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireMeUserId } from '@/lib/me/account'
import { createClient } from '@/lib/supabase/server'
import {
  isValidPublicKeyBase64,
  registerEncryptionKeySchema,
} from '@/lib/validations/encryption-key'

export async function GET() {
  try {
    const userId = await requireMeUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_encryption_keys')
      .select('public_key, key_version, created_at, rotated_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ key: null })

    return NextResponse.json({ key: data })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    return NextResponse.json({ error: 'تعذّر تحميل المفتاح' }, { status: 500 })
  }
}

/** Section 5.4 — register public key only (never private key material). */
export async function POST(request: Request) {
  try {
    const userId = await requireMeUserId()
    const body = registerEncryptionKeySchema.parse(await request.json())

    if (!isValidPublicKeyBase64(body.public_key)) {
      return NextResponse.json({ error: 'صيغة المفتاح العام غير صالحة' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: existing, error: fetchError } = await supabase
      .from('user_encryption_keys')
      .select('public_key, key_version')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (existing) {
      if (existing.public_key === body.public_key) {
        return NextResponse.json({
          user_id: userId,
          public_key: existing.public_key,
          key_version: existing.key_version,
        })
      }
      return NextResponse.json(
        { error: 'مفتاح عام مختلف مُسجَّل مسبقاً — استخدم تدوير المفاتيح لاحقاً' },
        { status: 409 },
      )
    }

    const { data, error } = await supabase
      .from('user_encryption_keys')
      .insert({
        user_id: userId,
        public_key: body.public_key,
        key_version: body.key_version,
      })
      .select('user_id, public_key, key_version')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message ?? 'بيانات غير صالحة'
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    return NextResponse.json({ error: 'تعذّر حفظ المفتاح' }, { status: 500 })
  }
}
