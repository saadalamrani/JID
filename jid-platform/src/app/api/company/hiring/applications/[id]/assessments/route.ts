import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { assignAssessment } from '@/lib/assessment-orchestration/service'

const bodySchema = z.object({ methodId: z.string().uuid(), stageId: z.string().uuid().nullish() })

export async function GET(_request: Request, context: { params: { id: string } }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('assessment_assignments')
    .select('id,method_id,stage_id,state,attempt_number,invited_at,expires_at,consented_at,started_at,completed_at,failure_code,assessment_methods(title_ar,title_en,purpose_ar,purpose_en,evidence_notice_ar,evidence_notice_en,requires_consent,assessment_providers(name_ar,name_en,kind,failure_state))')
    .eq('application_id', context.params.id).order('invited_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ assignments: data ?? [] })
}

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const body = bodySchema.parse(await request.json())
    const assignmentId = await assignAssessment(body.methodId, context.params.id, body.stageId)
    return NextResponse.json({ assignmentId, state: 'invited' }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid request' }, { status: 400 })
  }
}

