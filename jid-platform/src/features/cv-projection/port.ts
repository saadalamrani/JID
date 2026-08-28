import { unavailableCoreResult } from '@/features/career-record/operations'
import type { CvProjectionPort } from './operations'

export const unavailableCvProjectionPort: CvProjectionPort = {
  availability: 'unavailable',
  getCvProjection: () => unavailableCoreResult(),
  updateCvPresentation: () => unavailableCoreResult(),
  setCvEvidenceSelection: () => unavailableCoreResult(),
  previewCvProjection: () => unavailableCoreResult(),
  createCvSnapshot: () => unavailableCoreResult(),
}

export const boundCvProjectionPort: CvProjectionPort = {
  availability: 'ready',
  async getCvProjection(cvId) {
    const actions = await import('@/lib/career-record/actions')
    return actions.getCvProjectionAction(cvId)
  },
  async updateCvPresentation(cvId, patch) {
    const actions = await import('@/lib/career-record/actions')
    return actions.updateCvPresentationAction(cvId, patch)
  },
  async setCvEvidenceSelection(input) {
    const actions = await import('@/lib/career-record/actions')
    return actions.setCvEvidenceSelectionAction(input)
  },
  async previewCvProjection(cvId) {
    const actions = await import('@/lib/career-record/actions')
    return actions.previewCvProjectionAction(cvId)
  },
  async createCvSnapshot(input) {
    const actions = await import('@/lib/career-record/actions')
    return actions.createCvSnapshotAction(input)
  },
}

export function resolveCvProjectionPort(override?: CvProjectionPort): CvProjectionPort {
  return override ?? boundCvProjectionPort
}
