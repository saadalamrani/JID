import { NextResponse } from 'next/server'
import * as careerRecord from '@/lib/career-record/service'
import {
  toContractEvidence,
  toContractHistory,
  toAuthorizedDisclosure,
  toPortCvProjection,
} from '@/lib/career-record/contract-map'
import { jsonCareerRecordError, requireUuid } from '@/lib/career-record/http'
import { CareerRecordError } from '@/lib/career-record/errors'
import { resolveCvSharePresentation } from '@/lib/career-record/share'
import { CV_EXPORT_FORMATS, type CvExportFormatKey } from '@/lib/cv/formats/registry'

function asTemplateKey(value: string): CvExportFormatKey {
  return (CV_EXPORT_FORMATS as readonly string[]).includes(value)
    ? (value as CvExportFormatKey)
    : 'basic_free'
}

export async function handleListCareerEvidence(): Promise<NextResponse> {
  try {
    const rows = await careerRecord.listCareerEvidence()
    const data = rows
      .map((row) => toContractEvidence(row))
      .filter((row): row is NonNullable<typeof row> => row !== null)
    return NextResponse.json({ data })
  } catch (error) {
    return jsonCareerRecordError(error)
  }
}

export async function handleCreateDeclaredCareerEvidence(body: unknown): Promise<NextResponse> {
  try {
    const input = body as {
      category?: string
      fact_payload?: Record<string, unknown>
      effective_from?: string
      effective_to?: string
    }
    if (!input.category || !input.fact_payload) {
      throw new CareerRecordError('البيانات غير صالحة', 422)
    }
    const id = await careerRecord.createDeclaredCareerEvidence({
      category: input.category as Parameters<
        typeof careerRecord.createDeclaredCareerEvidence
      >[0]['category'],
      fact_payload: input.fact_payload,
      effective_from: input.effective_from,
      effective_to: input.effective_to,
    })
    const created = await careerRecord.getCareerEvidence(id)
    const mapped = toContractEvidence(created)
    return NextResponse.json({ data: mapped }, { status: 201 })
  } catch (error) {
    return jsonCareerRecordError(error)
  }
}

export async function handleGetCareerEvidence(evidenceId: string): Promise<NextResponse> {
  try {
    const history = await careerRecord.getCareerEvidence(requireUuid(evidenceId, 'evidence_id'))
    const mapped = toContractHistory(history)
    if (!mapped) throw new CareerRecordError('الدليل غير مكتمل', 404)
    return NextResponse.json({ data: mapped })
  } catch (error) {
    return jsonCareerRecordError(error)
  }
}

export async function handleReviseCareerEvidence(
  evidenceId: string,
  body: unknown,
): Promise<NextResponse> {
  try {
    const input = body as {
      expected_revision_no?: number
      fact_payload?: Record<string, unknown>
      effective_from?: string
      effective_to?: string
    }
    if (typeof input.expected_revision_no !== 'number' || !input.fact_payload) {
      throw new CareerRecordError('البيانات غير صالحة', 422)
    }
    await careerRecord.reviseCareerEvidence(requireUuid(evidenceId, 'evidence_id'), input.expected_revision_no, {
      fact_payload: input.fact_payload,
      effective_from: input.effective_from,
      effective_to: input.effective_to,
    })
    const updated = await careerRecord.getCareerEvidence(evidenceId)
    return NextResponse.json({ data: toContractEvidence(updated) })
  } catch (error) {
    return jsonCareerRecordError(error)
  }
}

export async function handleSetLifecycle(evidenceId: string, body: unknown): Promise<NextResponse> {
  try {
    const input = body as { action?: string; reason_ref?: { id: string; version?: string } }
    const action = input.action
    if (
      action !== 'archive' &&
      action !== 'unarchive' &&
      action !== 'dispute' &&
      action !== 'revoke' &&
      action !== 'expire'
    ) {
      throw new CareerRecordError('إجراء الحالة غير صالح', 422)
    }
    await careerRecord.setCareerEvidenceLifecycle(
      requireUuid(evidenceId, 'evidence_id'),
      action,
      input.reason_ref,
    )
    const updated = await careerRecord.getCareerEvidence(evidenceId)
    return NextResponse.json({ data: toContractEvidence(updated) })
  } catch (error) {
    return jsonCareerRecordError(error)
  }
}

export async function handleGetDisclosurePolicy(evidenceId: string): Promise<NextResponse> {
  try {
    const policy = await careerRecord.getCareerEvidenceDisclosurePolicy(
      requireUuid(evidenceId, 'evidence_id'),
    )
    return NextResponse.json({
      data: {
        policy_ref: { id: policy.id, version: policy.contract_version },
        default_visibility: 'PRIVATE',
      },
    })
  } catch (error) {
    return jsonCareerRecordError(error)
  }
}

export async function handleUpdateDisclosurePolicy(evidenceId: string): Promise<NextResponse> {
  try {
    const policy = await careerRecord.updateCareerEvidenceDisclosurePolicy(
      requireUuid(evidenceId, 'evidence_id'),
    )
    return NextResponse.json({
      data: {
        policy_ref: { id: policy.id, version: policy.contract_version },
        default_visibility: 'PRIVATE',
      },
    })
  } catch (error) {
    return jsonCareerRecordError(error)
  }
}

export async function handleAuthorizeDisclosure(body: unknown): Promise<NextResponse> {
  try {
    const input = body as Parameters<typeof careerRecord.authorizeCareerEvidenceDisclosure>[0]
    if (!input?.subject_id || !input.purpose_code || !input.basis_type || !input.basis_ref) {
      throw new CareerRecordError('إنشاء التفويض يتطلب أساساً مراجعاً ونطاقاً كاملاً', 422)
    }
    const id = await careerRecord.authorizeCareerEvidenceDisclosure(input)
    return NextResponse.json({ data: { authorization_id: id } }, { status: 201 })
  } catch (error) {
    return jsonCareerRecordError(error)
  }
}

export async function handleResolveDisclosure(body: unknown): Promise<NextResponse> {
  try {
    const input = body as { evidence_id?: string; authorization_id?: string }
    const evidenceId = requireUuid(input.evidence_id, 'evidence_id')
    const authorizationId = requireUuid(input.authorization_id, 'authorization_id')
    const history = await careerRecord.getCareerEvidence(evidenceId)
    const evidence = toContractEvidence(history)
    if (!evidence) throw new CareerRecordError('الدليل غير مكتمل', 404)
    const resolved = await careerRecord.resolveAuthorizedCareerEvidenceDisclosure({
      evidence_id: evidenceId,
      authorization_id: authorizationId,
    })
    return NextResponse.json({ data: toAuthorizedDisclosure(evidence, resolved) })
  } catch (error) {
    return jsonCareerRecordError(error)
  }
}

export async function handleGetCvProjection(cvId?: string): Promise<NextResponse> {
  try {
    const resolvedId = await careerRecord.resolveOwnerCvId(cvId)
    const [projection, authorizations] = await Promise.all([
      careerRecord.getCvProjection(resolvedId),
      careerRecord.listActiveOwnerAuthorizations(),
    ])
    return NextResponse.json({
      data: toPortCvProjection(projection, {
        title: projection.title,
        summary: projection.summary,
        locale: projection.locale,
        template_key: asTemplateKey(projection.template_key),
        share: resolveCvSharePresentation(authorizations, resolvedId),
        updated_at: projection.updated_at,
      }),
    })
  } catch (error) {
    return jsonCareerRecordError(error)
  }
}

export async function handleCreateApplicationCvSnapshot(body: unknown): Promise<NextResponse> {
  try {
    const input = body as {
      application_id?: string
      cv_id?: string
      authorization_id?: string
    }
    const snapshotId = await careerRecord.createApplicationCvSnapshot({
      application_id: requireUuid(input.application_id, 'application_id'),
      cv_id: requireUuid(input.cv_id, 'cv_id'),
      authorization_id: requireUuid(input.authorization_id, 'authorization_id'),
    })
    return NextResponse.json({ data: { snapshot_id: snapshotId } }, { status: 201 })
  } catch (error) {
    return jsonCareerRecordError(error)
  }
}
