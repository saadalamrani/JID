'use server'

import type {
  AuthorizeCareerEvidenceDisclosureInput,
  CareerRecordPort,
  CoreResult,
  CreateDeclaredCareerEvidenceInput,
  ResolveAuthorizedCareerEvidenceDisclosureInput,
  ReviseCareerEvidenceInput,
  SetCareerEvidenceLifecycleInput,
  UpdateCareerEvidenceDisclosurePolicyInput,
} from '@/features/career-record/operations'
import type {
  CreateCvSnapshotInput,
  CvPresentationPatch,
  CvProjection,
  CvProjectionPort,
  SetCvEvidenceSelectionInput,
} from '@/features/cv-projection/operations'
import { CV_EXPORT_FORMATS, type CvExportFormatKey } from '@/lib/cv/formats/registry'
import {
  coreResultFromError,
  okResult,
  toAuthorizedDisclosure,
  toContractEvidence,
  toContractHistory,
  toPortCvProjection,
} from './contract-map'
import { CareerRecordError } from './errors'
import * as careerRecord from './service'
import { resolveCvSharePresentation } from './share'

function asTemplateKey(value: string): CvExportFormatKey {
  return (CV_EXPORT_FORMATS as readonly string[]).includes(value)
    ? (value as CvExportFormatKey)
    : 'basic_free'
}

async function loadPortProjection(cvId?: string): Promise<CvProjection> {
  const resolvedId = await careerRecord.resolveOwnerCvId(cvId)
  const [projection, authorizations] = await Promise.all([
    careerRecord.getCvProjection(resolvedId),
    careerRecord.listActiveOwnerAuthorizations(),
  ])
  const share = resolveCvSharePresentation(authorizations, resolvedId)
  return toPortCvProjection(projection, {
    title: projection.title,
    summary: projection.summary,
    locale: projection.locale,
    template_key: asTemplateKey(projection.template_key),
    share,
    updated_at: projection.updated_at,
  })
}

export async function listCareerEvidenceAction(): Promise<
  Awaited<ReturnType<CareerRecordPort['listCareerEvidence']>>
> {
  try {
    const rows = await careerRecord.listCareerEvidence()
    const data = rows
      .map((row) => toContractEvidence(row))
      .filter((row): row is NonNullable<typeof row> => row !== null)
    return okResult(data)
  } catch (error) {
    return coreResultFromError(error)
  }
}

export async function getCareerEvidenceAction(
  evidenceId: string,
): Promise<Awaited<ReturnType<CareerRecordPort['getCareerEvidence']>>> {
  try {
    const history = await careerRecord.getCareerEvidence(evidenceId)
    const mapped = toContractHistory(history)
    if (!mapped) return { status: 'error', message: 'الدليل غير مكتمل' }
    return okResult(mapped)
  } catch (error) {
    return coreResultFromError(error)
  }
}

export async function createDeclaredCareerEvidenceAction(
  input: CreateDeclaredCareerEvidenceInput,
): Promise<Awaited<ReturnType<CareerRecordPort['createDeclaredCareerEvidence']>>> {
  try {
    const id = await careerRecord.createDeclaredCareerEvidence(input)
    const created = await careerRecord.getCareerEvidence(id)
    const mapped = toContractEvidence(created)
    if (!mapped) return { status: 'error', message: 'تعذر قراءة الدليل بعد إنشائه' }
    return okResult(mapped)
  } catch (error) {
    return coreResultFromError(error)
  }
}

export async function getCareerEvidenceDisclosurePolicyAction(
  evidenceId: string,
): Promise<Awaited<ReturnType<CareerRecordPort['getCareerEvidenceDisclosurePolicy']>>> {
  try {
    const policy = await careerRecord.getCareerEvidenceDisclosurePolicy(evidenceId)
    return okResult({
      policy_ref: { id: policy.id, version: policy.contract_version },
      default_visibility: 'PRIVATE',
    })
  } catch (error) {
    return coreResultFromError(error)
  }
}

export async function updateCareerEvidenceDisclosurePolicyAction(
  input: UpdateCareerEvidenceDisclosurePolicyInput,
): Promise<Awaited<ReturnType<CareerRecordPort['updateCareerEvidenceDisclosurePolicy']>>> {
  try {
    const policy = await careerRecord.updateCareerEvidenceDisclosurePolicy(input.evidence_id)
    return okResult({
      policy_ref: { id: policy.id, version: policy.contract_version },
      default_visibility: 'PRIVATE',
    })
  } catch (error) {
    return coreResultFromError(error)
  }
}

export async function reviseCareerEvidenceAction(
  input: ReviseCareerEvidenceInput,
): Promise<Awaited<ReturnType<CareerRecordPort['reviseCareerEvidence']>>> {
  try {
    await careerRecord.reviseCareerEvidence(input.evidence_id, input.expected_revision_no, {
      fact_payload: { ...input.fact_payload },
      effective_from: input.effective_from,
      effective_to: input.effective_to,
    })
    const updated = await careerRecord.getCareerEvidence(input.evidence_id)
    const mapped = toContractEvidence(updated)
    if (!mapped) return { status: 'error', message: 'تعذر قراءة الدليل بعد التصحيح' }
    return okResult(mapped)
  } catch (error) {
    return coreResultFromError(error)
  }
}

export async function setCareerEvidenceLifecycleAction(
  input: SetCareerEvidenceLifecycleInput,
): Promise<Awaited<ReturnType<CareerRecordPort['setCareerEvidenceLifecycle']>>> {
  try {
    await careerRecord.setCareerEvidenceLifecycle(input.evidence_id, input.action, input.reason_ref)
    const updated = await careerRecord.getCareerEvidence(input.evidence_id)
    const mapped = toContractEvidence(updated)
    if (!mapped) return { status: 'error', message: 'تعذر قراءة الدليل بعد تغيير الحالة' }
    return okResult(mapped)
  } catch (error) {
    return coreResultFromError(error)
  }
}

export async function authorizeCareerEvidenceDisclosureAction(
  input: AuthorizeCareerEvidenceDisclosureInput,
): Promise<Awaited<ReturnType<CareerRecordPort['authorizeCareerEvidenceDisclosure']>>> {
  try {
    if (!input.recipient.recipient_type) {
      return { status: 'error', message: 'المستلم غير محدد' }
    }
    throw new CareerRecordError(
      'إنشاء تفويض إفصاح يتطلب أساساً قانونياً مراجعاً ولا يُختلق من واجهة السيرة',
      422,
    )
  } catch (error) {
    return coreResultFromError(error)
  }
}

export async function resolveAuthorizedCareerEvidenceDisclosureAction(
  input: ResolveAuthorizedCareerEvidenceDisclosureInput,
): Promise<Awaited<ReturnType<CareerRecordPort['resolveAuthorizedCareerEvidenceDisclosure']>>> {
  try {
    const history = await careerRecord.getCareerEvidence(input.evidence_id)
    const evidence = toContractEvidence(history)
    if (!evidence) return { status: 'error', message: 'الدليل غير مكتمل' }
    const resolved = await careerRecord.resolveAuthorizedCareerEvidenceDisclosure({
      evidence_id: input.evidence_id,
      authorization_id: input.authorization_ref.id,
    })
    return okResult(toAuthorizedDisclosure(evidence, resolved))
  } catch (error) {
    return coreResultFromError(error)
  }
}

export async function getCvProjectionAction(
  cvId?: string,
): Promise<Awaited<ReturnType<CvProjectionPort['getCvProjection']>>> {
  try {
    return okResult(await loadPortProjection(cvId))
  } catch (error) {
    return coreResultFromError(error)
  }
}

export async function updateCvPresentationAction(
  cvId: string,
  patch: CvPresentationPatch,
): Promise<Awaited<ReturnType<CvProjectionPort['updateCvPresentation']>>> {
  try {
    await careerRecord.updateCvPresentation(cvId, {
      title: patch.title ?? undefined,
      summary: patch.summary ?? undefined,
      locale: patch.locale,
      template_key: patch.template_key,
      section_order: patch.section_order?.map((section_key, sort_order) => ({
        section_key,
        sort_order,
      })),
      item_presentation: patch.item_presentation
        ? {
            evidence_id: patch.item_presentation.evidence_id,
            presentation_payload: {
              ...patch.item_presentation.presentation_payload,
              selected_bullets: patch.item_presentation.presentation_payload.selected_bullets
                ? [...patch.item_presentation.presentation_payload.selected_bullets]
                : undefined,
            },
          }
        : undefined,
    })
    return okResult(await loadPortProjection(cvId))
  } catch (error) {
    return coreResultFromError(error)
  }
}

export async function setCvEvidenceSelectionAction(
  input: SetCvEvidenceSelectionInput,
): Promise<Awaited<ReturnType<CvProjectionPort['setCvEvidenceSelection']>>> {
  try {
    await careerRecord.setCvEvidenceSelection(input.cv_id, input.section_key, [
      ...input.ordered_evidence_ids,
    ])
    return okResult(await loadPortProjection(input.cv_id))
  } catch (error) {
    return coreResultFromError(error)
  }
}

export async function previewCvProjectionAction(
  cvId: string,
): Promise<Awaited<ReturnType<CvProjectionPort['previewCvProjection']>>> {
  return getCvProjectionAction(cvId)
}

export async function createCvSnapshotAction(
  input: CreateCvSnapshotInput,
): Promise<Awaited<ReturnType<CvProjectionPort['createCvSnapshot']>>> {
  try {
    if (input.purpose === 'APPLICATION') {
      return { status: 'error', message: 'استخدم العملية الذرية للقطة التقديم' }
    }
    const snapshotId = await careerRecord.createCvSnapshot({
      cv_id: input.cv_id,
      purpose: input.purpose,
      authorization_ref: input.authorization_ref,
    })
    return okResult({ snapshot_id: snapshotId })
  } catch (error) {
    return coreResultFromError(error)
  }
}

export async function createApplicationCvSnapshotAction(input: {
  application_id: string
  cv_id: string
  authorization_id: string
}): Promise<CoreResult<{ snapshot_id: string }>> {
  try {
    const snapshotId = await careerRecord.createApplicationCvSnapshot(input)
    return okResult({ snapshot_id: snapshotId })
  } catch (error) {
    return coreResultFromError(error)
  }
}
