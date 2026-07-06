import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireMeUserId } from '@/lib/me/account'
import { trackServer } from '@/lib/analytics/server'

const desiredFiltersSchema = z.object({
  sectors: z.array(z.string()).default([]),
  expertise_areas: z.array(z.string()).default([]),
  specializations: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  nationalities: z.array(z.string()).default([]),
  accepting_only: z.boolean().default(false),
})

const notificationRequestSchema = z.object({
  mentor_id: z.string().uuid().optional().nullable(),
  desired_filters: desiredFiltersSchema,
})

export async function POST(request: Request) {
  try {
    const userId = await requireMeUserId()
    const body = notificationRequestSchema.parse(await request.json())
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('mentor_notification_requests')
      .insert({
        mentor_id: body.mentor_id ?? null,
        requester_id: userId,
        desired_filters: body.desired_filters,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await trackServer('mentor_notification_requested', userId, {
      mentor_id: body.mentor_id ?? null,
    })

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'تعذّر إرسال الطلب'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
