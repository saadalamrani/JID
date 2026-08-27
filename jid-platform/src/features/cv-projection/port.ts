import { unavailableCoreResult } from '@/features/career-record/operations'
import type { CvProjectionPort } from './operations'

/**
 * Default bound port until Codex Core exists.
 * Returns unavailable. Does not invent HTTP, snapshots, or successful shares.
 */
export const unavailableCvProjectionPort: CvProjectionPort = {
  availability: 'unavailable',
  getCvProjection: () => unavailableCoreResult(),
  updateCvPresentation: () => unavailableCoreResult(),
  setCvEvidenceSelection: () => unavailableCoreResult(),
  previewCvProjection: () => unavailableCoreResult(),
  createCvSnapshot: () => unavailableCoreResult(),
}

/** Single swap point for later Core binding. */
export const boundCvProjectionPort: CvProjectionPort = unavailableCvProjectionPort
