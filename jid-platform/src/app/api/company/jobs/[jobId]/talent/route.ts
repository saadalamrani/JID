import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  addHiringCriterion,
  ensureHiringRoleForJob,
  searchTalentForJob,
} from '@/lib/talent-sourcing/service'

const criterionSchema = z.object({
  labelAr: z.string().trim().min(1).max(120),
  labelEn: z.string().trim().min(1).max(120),
})

export async function GET(_request: Request, context: { params: { jobId: string } }) {
  try {
    await ensureHiringRoleForJob(context.params.jobId)
    const result = await searchTalentForJob(context.params.jobId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    const status = message.includes('authentication') ? 401 : message.includes('not found') ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request, context: { params: { jobId: string } }) {
  try {
    const body = criterionSchema.parse(await request.json())
    const hiringRoleId = await ensureHiringRoleForJob(context.params.jobId)
    const criterionId = await addHiringCriterion({
      hiringRoleId,
      labelAr: body.labelAr,
      labelEn: body.labelEn,
    })
    return NextResponse.json({ hiringRoleId, criterionId }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
