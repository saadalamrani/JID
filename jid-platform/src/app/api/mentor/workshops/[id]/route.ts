import { NextResponse } from 'next/server'
import { z } from 'zod'
import { hasApprovedMentorProfile } from '@/lib/mentor-mode/has-mentor-role'
import {
  deleteMentorWorkshop,
  updateMentorWorkshop,
  WorkshopError,
} from '@/lib/mentor-workshops/crud'
import { requireMeUserId } from '@/lib/me/account'
import { workshopPatchSchema } from '@/lib/validations/workshop'
import { trackServer } from '@/lib/analytics/server'

type RouteContext = { params: { id: string } }

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const mentorId = await requireMeUserId()
    if (!(await hasApprovedMentorProfile(mentorId))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = workshopPatchSchema.parse(await request.json())
    const workshop = await updateMentorWorkshop(mentorId, params.id, body)

    if (body.status === 'published') {
      await trackServer('workshop_published', mentorId, { workshop_id: workshop.id })
    }

    return NextResponse.json({ workshop })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors[0]?.message ?? 'بيانات غير صالحة'
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    if (error instanceof WorkshopError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تحديث الورشة'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const mentorId = await requireMeUserId()
    if (!(await hasApprovedMentorProfile(mentorId))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    await deleteMentorWorkshop(mentorId, params.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    if (error instanceof WorkshopError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر حذف الورشة'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
