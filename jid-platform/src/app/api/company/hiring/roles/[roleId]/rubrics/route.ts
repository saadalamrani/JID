import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ASSESSMENT_METHODS, RUBRIC_SCALE_POINTS } from '@/types/contracts/hiring-evidence'
import { createClient } from '@/lib/supabase/server'
import { createRubric, publishRubricVersion } from '@/lib/hiring-evidence/evidence-service'

const anchorSchema = z.object({
  point: z.number().int().min(1).max(5),
  descriptorAr: z.string().trim().min(1).max(2000),
  descriptorEn: z.string().trim().min(1).max(2000),
})

const bodySchema = z.object({
  criterionId: z.string().uuid(),
  method: z.enum(ASSESSMENT_METHODS),
  nameAr: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().min(1).max(200),
  scalePoints: z
    .number()
    .int()
    .refine((n): n is (typeof RUBRIC_SCALE_POINTS)[number] => (RUBRIC_SCALE_POINTS as readonly number[]).includes(n), {
      message: 'scalePoints must be 3, 4, or 5',
    }),
  anchors: z.array(anchorSchema).min(3).max(5),
})

export async function GET(_request: Request, context: { params: { roleId: string } }) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('hiring_rubrics')
      .select(
        'id, criterion_id, method, name_ar, name_en, state, current_version_id, ' +
          'hiring_rubric_versions(id, scale_points, created_at, hiring_rubric_anchors(point, descriptor_ar, descriptor_en))',
      )
      .eq('hiring_role_id', context.params.roleId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return NextResponse.json({ rubrics: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(request: Request, context: { params: { roleId: string } }) {
  try {
    const body = bodySchema.parse(await request.json())
    if (body.anchors.length !== body.scalePoints) {
      return NextResponse.json(
        { error: `exactly ${body.scalePoints} anchors are required for a ${body.scalePoints}-point scale` },
        { status: 400 },
      )
    }
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return NextResponse.json({ error: 'authentication required' }, { status: 401 })

    const rubricId = await createRubric({
      hiringRoleId: context.params.roleId,
      criterionId: body.criterionId,
      method: body.method,
      nameAr: body.nameAr,
      nameEn: body.nameEn,
      createdBy: auth.user.id,
    })
    const versionId = await publishRubricVersion({
      rubricId,
      scalePoints: body.scalePoints,
      anchors: body.anchors,
    })
    return NextResponse.json({ rubricId, versionId }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
