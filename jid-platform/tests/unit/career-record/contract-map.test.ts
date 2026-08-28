import { describe, expect, it } from 'vitest'
import { toContractEvidence } from '@/lib/career-record/contract-map'
import type { CareerEvidenceView } from '@/types/career-record'
import { boundCareerRecordPort } from '@/features/career-record/port'
import { boundCvProjectionPort } from '@/features/cv-projection/port'
import {
  CAREER_RECORD_CORE_OPERATIONS,
} from '@/features/career-record/operations'
import { CV_PROJECTION_CORE_OPERATIONS } from '@/features/cv-projection/operations'

const view = {
  id: 'ev-1',
  subject_id: 'user-1',
  category: 'EXPERIENCE',
  disclosure_policy_id: 'pol-1',
  current_revision_id: 'rev-2',
  lifecycle_state: 'ACTIVE',
  archived_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
  current_revision: {
    id: 'rev-2',
    evidence_id: 'ev-1',
    subject_id: 'user-1',
    revision_no: 2,
    contract_version: '1.0',
    fact_payload: { company_name: 'شركة' },
    source_class: 'SELF_DECLARED',
    source_ref: null,
    verification_state: 'DECLARED',
    effective_from: null,
    effective_to: null,
    observed_at: null,
    supersedes_revision_id: 'rev-1',
    dispute_ref: null,
    revocation_or_expiry_ref: null,
    primary_artifact_id: null,
    created_at: '2026-01-02T00:00:00.000Z',
  },
} satisfies CareerEvidenceView

describe('toContractEvidence', () => {
  it('maps a current revision without fabricating verification', () => {
    const mapped = toContractEvidence(view)
    expect(mapped?.verification_state).toBe('DECLARED')
    expect(mapped?.source_class).toBe('SELF_DECLARED')
    expect(mapped?.disclosure_policy_ref).toEqual({ id: 'pol-1', version: '1.0' })
    expect(mapped?.fact_payload).toEqual({ company_name: 'شركة' })
  })

  it('derives CORRECTED only from successor history, never as stored state', () => {
    const mapped = toContractEvidence(view, { successorExists: true })
    expect(mapped?.verification_state).toBe('CORRECTED')
  })
})

describe('production port binding', () => {
  it('exposes a ready Career Record Core binding for every frozen operation', () => {
    expect(boundCareerRecordPort.availability).toBe('ready')
    for (const name of CAREER_RECORD_CORE_OPERATIONS) {
      expect(name in boundCareerRecordPort).toBe(true)
    }
  })

  it('exposes a ready CV projection Core binding for every frozen operation', () => {
    expect(boundCvProjectionPort.availability).toBe('ready')
    for (const name of CV_PROJECTION_CORE_OPERATIONS) {
      expect(name in boundCvProjectionPort).toBe(true)
    }
  })
})
