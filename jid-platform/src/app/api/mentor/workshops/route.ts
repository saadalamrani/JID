import { NextResponse } from 'next/server'
import { z } from 'zod'
import { hasApprovedMentorProfile } from '@/lib/mentor-mode/has-mentor-role'
import {
  createMentorWorkshop,
  listMentorWorkshops,
  WorkshopError,
} from '@/lib/mentor-workshops/crud'
import { requireMeUserId } from '@/lib/me/account'
import { workshopUpsertSchema } from '@/lib/validations/workshop'
import { trackServer } from '@/lib/analytics/server'

export async function GET() {
  try {
    const mentorId = await requireMeUserId()
    if (!(await hasApprovedMentorProfile(mentorId))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }
    const workshops = await listMentorWorkshops(mentorId)
    return NextResponse.json({ workshops })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تحميل الورش'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const mentorId = await requireMeUserId()
    if (!(await hasApprovedMentorProfile(mentorId))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = workshopUpsertSchema.parse(await request.json())
    const workshop = await createMentorWorkshop(mentorId, body)

    await trackServer('workshop_created', mentorId, { workshop_id: workshop.id })
    if (workshop.status === 'published') {
      await trackServer('workshop_published', mentorId, { workshop_id: workshop.id })
    }

    return NextResponse.json({ workshop }, { status: 201 })
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
    const message = error instanceof Error ? error.message : 'تعذّر إنشاء الورشة'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
