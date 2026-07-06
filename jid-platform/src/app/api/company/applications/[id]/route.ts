import { NextResponse } from 'next/server'
import { z } from 'zod'
import { MutationError, updateApplicationStatus } from '@/lib/applications/triage-mutations'
import { APPLICATION_STATUSES } from '@/types/application'

const patchSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = patchSchema.parse(await request.json())
    const result = await updateApplicationStatus(id, body.status)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }
    if (error instanceof MutationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تحديث الحالة'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
