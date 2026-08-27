import type { CareerRecordPort } from './operations'
import { unavailableCoreResult } from './operations'

/**
 * Default bound port until Codex Core exists.
 * Returns unavailable. Does not invent HTTP, records, or successful writes.
 */
export const unavailableCareerRecordPort: CareerRecordPort = {
  availability: 'unavailable',
  listCareerEvidence: () => unavailableCoreResult(),
  getCareerEvidence: () => unavailableCoreResult(),
  createDeclaredCareerEvidence: () => unavailableCoreResult(),
  getCareerEvidenceDisclosurePolicy: () => unavailableCoreResult(),
  reviseCareerEvidence: () => unavailableCoreResult(),
  setCareerEvidenceLifecycle: () => unavailableCoreResult(),
}

/** Single swap point for later Core binding. */
export const boundCareerRecordPort: CareerRecordPort = unavailableCareerRecordPort
