import type { CareerEvidence, ContractId } from '@/types/contracts'
import type {
  CareerRecordPort,
  CoreResult,
} from '@/features/career-record/operations'
import { makeCareerEvidence } from './fixtures'

export function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

export type CareerRecordTestListMode =
  | { kind: 'hang'; promise: Promise<CoreResult<readonly CareerEvidence[]>> }
  | { kind: 'unavailable' }
  | { kind: 'forbidden' }
  | { kind: 'error'; message?: string }
  | { kind: 'stale'; asOf?: string }
  | { kind: 'ok' }

export type CareerRecordTestPortOptions = {
  availability?: 'ready' | 'unavailable'
  items?: CareerEvidence[]
  list?: CareerRecordTestListMode
  authorize?: boolean
}

/**
 * In-memory Career Record port for tests only.
 * Does not ship in production runtime and does not invent HTTP.
 */
export function createCareerRecordTestPort(
  options: CareerRecordTestPortOptions = {},
): CareerRecordPort {
  const items: CareerEvidence[] = [...(options.items ?? [])]
  const listMode: CareerRecordTestListMode = options.list ?? { kind: 'ok' }
  const availability = options.availability ?? 'ready'

  function listResult(): CoreResult<readonly CareerEvidence[]> {
    switch (listMode.kind) {
      case 'unavailable':
        return { status: 'unavailable' }
      case 'forbidden':
        return { status: 'forbidden' }
      case 'error':
        return { status: 'error', message: listMode.message }
      case 'stale':
        return { status: 'stale', data: [...items], asOf: listMode.asOf }
      case 'ok':
        return { status: 'ok', data: [...items] }
      case 'hang':
        return { status: 'unavailable' }
    }
  }

  return {
    availability,
    async listCareerEvidence() {
      if (listMode.kind === 'hang') {
        return listMode.promise
      }
      return listResult()
    },
    async getCareerEvidence(evidenceId: ContractId) {
      const current = items.find((item) => item.evidence_id === evidenceId)
      if (!current) return { status: 'error', message: 'missing' }
      return { status: 'ok', data: { current, revisions: [] } }
    },
    async createDeclaredCareerEvidence(input) {
      const created = makeCareerEvidence({
        evidence_id: `declared-${items.length + 1}`,
        category: input.category,
        verification_state: 'DECLARED',
        source_class: 'SELF_DECLARED',
        fact_payload: input.fact_payload,
        effective_from: input.effective_from,
        effective_to: input.effective_to,
      })
      items.push(created)
      return { status: 'ok', data: created }
    },
    async getCareerEvidenceDisclosurePolicy() {
      return {
        status: 'ok',
        data: {
          policy_ref: { id: 'policy-private', version: '1.0' },
          default_visibility: 'PRIVATE',
        },
      }
    },
    async updateCareerEvidenceDisclosurePolicy(input) {
      return {
        status: 'ok',
        data: {
          policy_ref: input.policy_ref,
          default_visibility: 'PRIVATE',
        },
      }
    },
    async reviseCareerEvidence(input) {
      const index = items.findIndex((item) => item.evidence_id === input.evidence_id)
      if (index === -1) return { status: 'error', message: 'missing' }
      const previous = items[index]!
      const next: CareerEvidence = {
        ...previous,
        fact_payload: input.fact_payload,
        revision_no: previous.revision_no + 1,
        verification_state: 'CORRECTED',
        supersedes_evidence_id: previous.evidence_id,
      }
      items[index] = next
      return { status: 'ok', data: next }
    },
    async setCareerEvidenceLifecycle(input) {
      const index = items.findIndex((item) => item.evidence_id === input.evidence_id)
      if (index === -1) return { status: 'error', message: 'missing' }
      const previous = items[index]!
      const verification_state =
        input.action === 'dispute'
          ? 'DISPUTED'
          : input.action === 'revoke'
            ? 'REVOKED'
            : input.action === 'expire'
              ? 'EXPIRED'
              : previous.verification_state
      const next: CareerEvidence = {
        ...previous,
        verification_state,
        dispute_ref: input.action === 'dispute' ? { id: 'dispute-test' } : previous.dispute_ref,
        revocation_or_expiry_ref:
          input.action === 'revoke' || input.action === 'expire'
            ? { id: `${input.action}-test` }
            : previous.revocation_or_expiry_ref,
      }
      items[index] = next
      return { status: 'ok', data: next }
    },
    async authorizeCareerEvidenceDisclosure() {
      if (!options.authorize) return { status: 'unavailable' }
      return { status: 'unavailable' }
    },
    async resolveAuthorizedCareerEvidenceDisclosure() {
      if (!options.authorize) return { status: 'unavailable' }
      return { status: 'unavailable' }
    },
  }
}
