import { NextResponse } from 'next/server'
import { z } from 'zod'
import { bulkUpdateApplicationStatuses, MutationError } from '@/lib/applications/triage-mutations'
import { TRIAGE_BULK_ACTIONS } from '@/types/application'
import { triageActionToStatus } from '@/types/application'

const bulkSchema = z.object({
  applicationIds: z.array(z.string().uuid()).min(1),
  action: z.enum(TRIAGE_BULK_ACTIONS),
})

export async function POST(request: Request) {
  try {
    const body = bulkSchema.parse(await request.json())
    const status = triageActionToStatus(body.action)
    const result = await bulkUpdateApplicationStatuses(body.applicationIds, status)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }
    if (error instanceof MutationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    const message = error instanceof Error ? error.message : 'تعذّر تحديث الطلبات'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
