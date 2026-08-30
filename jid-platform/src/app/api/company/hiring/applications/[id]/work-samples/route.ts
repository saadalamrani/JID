import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { assignWorkSample } from '@/lib/hiring-evidence/evidence-service'

const bodySchema = z.object({
  taskId: z.string().uuid(),
  dueAt: z.string().datetime().nullish(),
})

export async function GET(_request: Request, context: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('hiring_work_sample_submissions')
      .select(
        'id, task_id, state, assigned_at, due_at, submitted_at, artifact_refs, ' +
          'hiring_work_sample_tasks(title_ar, title_en, instructions_ar, instructions_en, time_box_minutes)',
      )
      .eq('application_id', context.params.id)
      .order('assigned_at', { ascending: true })
    if (error) throw new Error(error.message)
    return NextResponse.json({ submissions: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const body = bodySchema.parse(await request.json())
    const submissionId = await assignWorkSample({
      taskId: body.taskId,
      applicationId: context.params.id,
      dueAt: body.dueAt ?? null,
    })
    return NextResponse.json({ submissionId }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
