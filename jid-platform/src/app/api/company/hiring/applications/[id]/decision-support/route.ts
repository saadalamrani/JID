import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AI_PERMITTED_ACTIONS } from '@/types/contracts/hiring-evidence'
import { createClient } from '@/lib/supabase/server'
import { generateDecisionSupport } from '@/lib/hiring-evidence/evidence-service'

const bodySchema = z.object({
  stageId: z.string().uuid().nullable(),
  summaryAr: z.string().trim().max(20000).nullable(),
  summaryEn: z.string().trim().max(20000).nullable(),
  missingEvidence: z.array(z.unknown()).max(200).optional(),
  inconsistencies: z.array(z.unknown()).max(200).optional(),
  aiAssist: z
    .object({
      action: z.enum(AI_PERMITTED_ACTIONS),
      modelRef: z.string().trim().min(1).max(200),
    })
    .optional(),
})

export async function GET(_request: Request, context: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('hiring_assessment_decision_support')
      .select('id, stage_id, requested_by, summary_ar, summary_en, missing_evidence, inconsistencies, ai_assist_ref, generated_at')
      .eq('application_id', context.params.id)
      .order('generated_at', { ascending: false })
    if (error) throw new Error(error.message)
    return NextResponse.json({ decisionSupport: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const body = bodySchema.parse(await request.json())
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return NextResponse.json({ error: 'authentication required' }, { status: 401 })

    const id = await generateDecisionSupport({
      applicationId: context.params.id,
      stageId: body.stageId,
      summaryAr: body.summaryAr,
      summaryEn: body.summaryEn,
      missingEvidence: body.missingEvidence,
      inconsistencies: body.inconsistencies,
      aiAssist: body.aiAssist
        ? { action: body.aiAssist.action, humanRequesterId: auth.user.id, modelRef: body.aiAssist.modelRef }
        : null,
    })
    return NextResponse.json({ decisionSupportId: id }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
