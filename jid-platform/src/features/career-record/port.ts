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
  updateCareerEvidenceDisclosurePolicy: () => unavailableCoreResult(),
  reviseCareerEvidence: () => unavailableCoreResult(),
  setCareerEvidenceLifecycle: () => unavailableCoreResult(),
  authorizeCareerEvidenceDisclosure: () => unavailableCoreResult(),
  resolveAuthorizedCareerEvidenceDisclosure: () => unavailableCoreResult(),
}

/** Single swap point for later Core binding. Production stays unavailable until Codex binds Core. */
export const boundCareerRecordPort: CareerRecordPort = unavailableCareerRecordPort

/** Test/runtime injection seam. Production callers omit the override. */
export function resolveCareerRecordPort(override?: CareerRecordPort): CareerRecordPort {
  return override ?? boundCareerRecordPort
}
