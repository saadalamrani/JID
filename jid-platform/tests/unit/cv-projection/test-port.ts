import type { ContractId } from '@/types/contracts'
import type { CoreResult } from '@/features/career-record/operations'
import type {
  CvProjection,
  CvProjectionPort,
  CvSharePresentation,
} from '@/features/cv-projection/operations'
import { CATEGORY_TO_SECTION } from '@/features/cv-projection/operations'
import { makeCvProjection } from './fixtures'

export type CvProjectionTestShareMode = 'private' | 'unavailable' | 'authorized'

export type CvProjectionTestPortOptions = {
  availability?: 'ready' | 'unavailable'
  projection?: CvProjection
  get?:
    | { kind: 'hang'; promise: Promise<CoreResult<CvProjection>> }
    | { kind: 'unavailable' }
    | { kind: 'forbidden' }
    | { kind: 'error'; message?: string }
    | { kind: 'stale'; asOf?: string }
    | { kind: 'ok' }
  shareMode?: CvProjectionTestShareMode
}

/**
 * In-memory CV projection port for tests only.
 * Authorized share UI is returned only when shareMode is explicitly 'authorized'.
 */
export function createCvProjectionTestPort(
  options: CvProjectionTestPortOptions = {},
): CvProjectionPort {
  let projection: CvProjection = options.projection ?? makeCvProjection()
  const getMode = options.get ?? { kind: 'ok' }
  const shareMode: CvProjectionTestShareMode = options.shareMode ?? 'private'
  const availability = options.availability ?? 'ready'

  function currentShare(): CvSharePresentation {
    if (shareMode === 'authorized' && projection.share.kind === 'authorized') {
      return projection.share
    }
    if (shareMode === 'authorized') {
      return {
        kind: 'authorized',
        purpose: 'PUBLIC_SHARE',
        recipient_label: 'جهة مستلمة مصرّح بها',
        authorization_ref: { id: 'authz-test' },
      }
    }
    return { kind: 'private' }
  }

  function snapshot(): CvProjection {
    return { ...projection, share: currentShare() }
  }

  return {
    availability,
    async getCvProjection() {
      if (getMode.kind === 'hang') return getMode.promise
      if (getMode.kind === 'unavailable') return { status: 'unavailable' }
      if (getMode.kind === 'forbidden') return { status: 'forbidden' }
      if (getMode.kind === 'error') return { status: 'error', message: getMode.message }
      if (getMode.kind === 'stale') {
        return { status: 'stale', data: snapshot(), asOf: getMode.asOf }
      }
      return { status: 'ok', data: snapshot() }
    },
    async updateCvPresentation(_cvId, patch) {
      const nextItems = patch.item_presentation
        ? projection.items.map((item) =>
            item.evidence_id === patch.item_presentation!.evidence_id
              ? { ...item, presentation_payload: patch.item_presentation!.presentation_payload }
              : item,
          )
        : projection.items
      const nextSections = patch.section_order
        ? projection.sections.map((section) => ({
            ...section,
            sort_order: patch.section_order!.indexOf(section.section_key),
          }))
        : projection.sections
      projection = {
        ...projection,
        title: patch.title !== undefined ? patch.title : projection.title,
        summary: patch.summary !== undefined ? patch.summary : projection.summary,
        locale: patch.locale ?? projection.locale,
        template_key: patch.template_key ?? projection.template_key,
        sections: nextSections,
        items: nextItems,
        share: currentShare(),
      }
      return { status: 'ok', data: snapshot() }
    },
    async setCvEvidenceSelection(input) {
      const selected = new Set(input.ordered_evidence_ids)
      const nextItems = projection.items.map((item) => {
        if (item.section_key !== input.section_key) return item
        const order = input.ordered_evidence_ids.indexOf(item.evidence_id)
        return {
          ...item,
          is_selected: selected.has(item.evidence_id),
          sort_order: order === -1 ? item.sort_order : order,
        }
      })
      const missing = input.ordered_evidence_ids.filter(
        (id) => !nextItems.some((item) => item.evidence_id === id),
      )
      const extras = missing.map((evidence_id, index) => {
        const record = projection.evidence.find((item) => item.evidence_id === evidence_id)
        return {
          evidence_id,
          section_key: record ? CATEGORY_TO_SECTION[record.category] : input.section_key,
          sort_order: input.ordered_evidence_ids.length + index,
          is_selected: true,
          presentation_payload: {},
        }
      })
      projection = { ...projection, items: [...nextItems, ...extras], share: currentShare() }
      return { status: 'ok', data: snapshot() }
    },
    async previewCvProjection() {
      return { status: 'ok', data: snapshot() }
    },
    async createCvSnapshot(input) {
      if (shareMode === 'unavailable' || shareMode === 'private') {
        return { status: 'unavailable' }
      }
      projection = {
        ...projection,
        share: {
          kind: 'authorized',
          purpose: input.purpose,
          recipient_label: 'جهة مستلمة مصرّح بها',
          authorization_ref: input.authorization_ref ?? { id: 'authz-test' },
        },
      }
      return { status: 'ok', data: { snapshot_id: 'snapshot-test' as ContractId } }
    },
  }
}
