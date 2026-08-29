import { NextResponse } from 'next/server'
import { z } from 'zod'
import { initializeHiringRole } from '@/lib/hiring/workspace-service'

const bodySchema = z.object({
  titleAr: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().min(1).max(200),
})

export async function POST(request: Request, context: { params: { jobId: string } }) {
  try {
    const body = bodySchema.parse(await request.json())
    const hiringRoleId = await initializeHiringRole({
      jobId: context.params.jobId,
      titleAr: body.titleAr,
      titleEn: body.titleEn,
    })
    return NextResponse.json({ hiringRoleId }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
