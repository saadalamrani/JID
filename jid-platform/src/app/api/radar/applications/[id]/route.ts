import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  ApplicantStatusUpdateError,
  updateApplicantApplicationStatus,
} from '@/lib/radar/applicant-status-update.server'
import { RADAR_COLUMN_IDS } from '@/lib/radar/column-config'
import { APPLICATION_STATUSES } from '@/types/application'

const patchSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  fromColumn: z.enum(RADAR_COLUMN_IDS).optional(),
  toColumn: z.enum(RADAR_COLUMN_IDS).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = patchSchema.parse(await request.json())
    const result = await updateApplicantApplicationStatus({
      applicationId: id,
      status: body.status,
      fromColumn: body.fromColumn,
      toColumn: body.toColumn,
    })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }
    if (error instanceof ApplicantStatusUpdateError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تحديث الحالة'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
