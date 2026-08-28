import type { CareerRecordPort } from './operations'
import { unavailableCoreResult } from './operations'

/**
 * Honest unavailable seam. Tests inject in-memory ports; this object must stay
 * unavailable so the harness can prove production never invents records.
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

/**
 * Production Core binding. Methods lazy-import server actions so unit tests that
 * only inject ports never load `server-only` modules.
 */
export const boundCareerRecordPort: CareerRecordPort = {
  availability: 'ready',
  async listCareerEvidence() {
    const actions = await import('@/lib/career-record/actions')
    return actions.listCareerEvidenceAction()
  },
  async getCareerEvidence(evidenceId) {
    const actions = await import('@/lib/career-record/actions')
    return actions.getCareerEvidenceAction(evidenceId)
  },
  async createDeclaredCareerEvidence(input) {
    const actions = await import('@/lib/career-record/actions')
    return actions.createDeclaredCareerEvidenceAction(input)
  },
  async getCareerEvidenceDisclosurePolicy(evidenceId) {
    const actions = await import('@/lib/career-record/actions')
    return actions.getCareerEvidenceDisclosurePolicyAction(evidenceId)
  },
  async updateCareerEvidenceDisclosurePolicy(input) {
    const actions = await import('@/lib/career-record/actions')
    return actions.updateCareerEvidenceDisclosurePolicyAction(input)
  },
  async reviseCareerEvidence(input) {
    const actions = await import('@/lib/career-record/actions')
    return actions.reviseCareerEvidenceAction(input)
  },
  async setCareerEvidenceLifecycle(input) {
    const actions = await import('@/lib/career-record/actions')
    return actions.setCareerEvidenceLifecycleAction(input)
  },
  async authorizeCareerEvidenceDisclosure(input) {
    const actions = await import('@/lib/career-record/actions')
    return actions.authorizeCareerEvidenceDisclosureAction(input)
  },
  async resolveAuthorizedCareerEvidenceDisclosure(input) {
    const actions = await import('@/lib/career-record/actions')
    return actions.resolveAuthorizedCareerEvidenceDisclosureAction(input)
  },
}

/** Test/runtime injection seam. Production callers omit the override. */
export function resolveCareerRecordPort(override?: CareerRecordPort): CareerRecordPort {
  return override ?? boundCareerRecordPort
}
