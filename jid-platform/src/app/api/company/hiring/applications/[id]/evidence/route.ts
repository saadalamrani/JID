import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ASSESSMENT_METHODS } from '@/types/contracts/hiring-evidence'
import { createClient } from '@/lib/supabase/server'
import { recordObservation, recordRating } from '@/lib/hiring-evidence/evidence-service'

const OBSERVATION_SOURCES = [
  'structured_screening',
  'work_sample',
  'interview_session',
  'reference_check',
] as const

const bodySchema = z.object({
  criterionId: z.string().uuid(),
  method: z.enum(ASSESSMENT_METHODS),
  source: z.enum(OBSERVATION_SOURCES),
  sourceTable: z.string().trim().min(1).max(120),
  sourceId: z.string().uuid(),
  evidenceFound: z.boolean(),
  stageId: z.string().uuid().nullish(),
  noteAr: z.string().trim().max(8000).nullish(),
  noteEn: z.string().trim().max(8000).nullish(),
  citations: z
    .array(z.object({ label: z.string().trim().min(1).max(300), href: z.string().trim().min(1).max(2000) }))
    .max(50)
    .optional(),
  workSampleTaskId: z.string().uuid().nullish(),
  planItemId: z.string().uuid().nullish(),
  supersedesObservationId: z.string().uuid().nullish(),
  rating: z
    .object({
      rubricVersionId: z.string().uuid(),
      anchorPoint: z.number().int().min(1).max(5).nullable(),
      rationaleAr: z.string().trim().max(8000).nullish(),
      rationaleEn: z.string().trim().max(8000).nullish(),
    })
    .optional(),
})

export async function GET(_request: Request, context: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const applicationId = context.params.id

    const [observations, ratings, scorecards, workSamples, decisionSupport] = await Promise.all([
      supabase
        .from('hiring_observations')
        .select(
          'id, criterion_id, method, evaluator_id, stage_id, evidence_found, note_ar, note_en, citations, recorded_at, supersedes_observation_id',
        )
        .eq('application_id', applicationId)
        .order('recorded_at', { ascending: true }),
      supabase
        .from('hiring_scorecard_ratings')
        .select('id, observation_id, rubric_version_id, anchor_point, evaluator_id, rationale_ar, rationale_en, rated_at'),
      supabase
        .from('hiring_scorecards')
        .select('id, stage_id, evaluator_id, state, submitted_at, frozen_rating_ids')
        .eq('application_id', applicationId),
      supabase
        .from('hiring_work_sample_submissions')
        .select('id, task_id, state, assigned_at, due_at, submitted_at, artifact_refs')
        .eq('application_id', applicationId),
      supabase
        .from('hiring_assessment_decision_support')
        .select('id, stage_id, requested_by, summary_ar, summary_en, missing_evidence, inconsistencies, generated_at')
        .eq('application_id', applicationId)
        .order('generated_at', { ascending: false }),
    ])

    const firstError =
      observations.error || ratings.error || scorecards.error || workSamples.error || decisionSupport.error
    if (firstError) throw new Error(firstError.message)

    return NextResponse.json({
      observations: observations.data ?? [],
      ratings: ratings.data ?? [],
      scorecards: scorecards.data ?? [],
      workSamples: workSamples.data ?? [],
      decisionSupport: decisionSupport.data ?? [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const body = bodySchema.parse(await request.json())
    const observationId = await recordObservation({
      applicationId: context.params.id,
      criterionId: body.criterionId,
      method: body.method,
      source: body.source,
      sourceTable: body.sourceTable,
      sourceId: body.sourceId,
      evidenceFound: body.evidenceFound,
      stageId: body.stageId ?? null,
      noteAr: body.noteAr ?? null,
      noteEn: body.noteEn ?? null,
      citations: body.citations,
      workSampleTaskId: body.workSampleTaskId ?? null,
      planItemId: body.planItemId ?? null,
      supersedesObservationId: body.supersedesObservationId ?? null,
    })

    let ratingId: string | null = null
    if (body.rating) {
      ratingId = await recordRating({
        observationId,
        rubricVersionId: body.rating.rubricVersionId,
        anchorPoint: body.rating.anchorPoint,
        rationaleAr: body.rating.rationaleAr ?? null,
        rationaleEn: body.rating.rationaleEn ?? null,
      })
    }

    return NextResponse.json({ observationId, ratingId }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
