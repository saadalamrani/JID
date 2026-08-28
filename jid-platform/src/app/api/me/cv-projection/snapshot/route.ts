import * as careerRecord from '@/lib/career-record/service'
import { jsonCareerRecordError, requireUuid } from '@/lib/career-record/http'
import { NextResponse } from 'next/server'
import type { CvSnapshotPurpose } from '@/types/career-record'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      cv_id?: string
      purpose?: CvSnapshotPurpose
      authorization_id?: string
    }
    const snapshotId = await careerRecord.createCvSnapshot({
      cv_id: requireUuid(body.cv_id, 'cv_id'),
      purpose: body.purpose ?? 'EXPORT',
      authorization_ref: body.authorization_id ? { id: body.authorization_id } : undefined,
    })
    return NextResponse.json({ data: { snapshot_id: snapshotId } }, { status: 201 })
  } catch (error) {
    return jsonCareerRecordError(error)
  }
}
