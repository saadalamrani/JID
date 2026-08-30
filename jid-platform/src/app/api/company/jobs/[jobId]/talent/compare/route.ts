import { NextResponse } from 'next/server'
import { z } from 'zod'
import { compareTalentForJob } from '@/lib/talent-sourcing/service'

const bodySchema = z.object({
  profileIds: z.array(z.string().uuid()).min(1).max(5),
})

export async function POST(request: Request, context: { params: { jobId: string } }) {
  try {
    const body = bodySchema.parse(await request.json())
    const grid = await compareTalentForJob(context.params.jobId, body.profileIds)
    return NextResponse.json(grid)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
