import type { CareerEvidence } from '@/types/contracts'

export function makeCareerEvidence(
  overrides: Partial<CareerEvidence> &
    Pick<CareerEvidence, 'evidence_id' | 'category' | 'verification_state' | 'source_class'>,
): CareerEvidence {
  return {
    contract_version: '1.0',
    subject_id: 'subject-owner',
    fact_payload: {},
    revision_no: 1,
    disclosure_policy_ref: { id: 'policy-private', version: '1.0' },
    ...overrides,
  }
}

export const populatedCareerEvidence: CareerEvidence[] = [
  makeCareerEvidence({
    evidence_id: 'edu-1',
    category: 'EDUCATION',
    verification_state: 'DECLARED',
    source_class: 'SELF_DECLARED',
    fact_payload: {
      institution_name: 'جامعة الملك سعود',
      degree: 'بكالوريوس',
      field_of_study: 'هندسة البرمجيات',
      start_year: '2020',
      end_year: '2024',
    },
  }),
  makeCareerEvidence({
    evidence_id: 'exp-1',
    category: 'EXPERIENCE',
    verification_state: 'VERIFIED',
    source_class: 'ISSUER_VERIFIED',
    source_ref: { id: 'issuer-1' },
    fact_payload: {
      company_name: 'شركة تقنية',
      job_title: 'مهندس برمجيات',
      location: 'الرياض',
    },
  }),
  makeCareerEvidence({
    evidence_id: 'skill-1',
    category: 'SKILL',
    verification_state: 'CONFIRMED',
    source_class: 'ORGANIZATION_CONFIRMED',
    source_ref: { id: 'org-1' },
    fact_payload: { name: 'TypeScript' },
  }),
  makeCareerEvidence({
    evidence_id: 'proj-1',
    category: 'PROJECT',
    verification_state: 'SOURCED',
    source_class: 'THIRD_PARTY_SOURCED',
    source_ref: { id: 'source-1' },
    fact_payload: { title: 'منصة داخلية' },
  }),
  makeCareerEvidence({
    evidence_id: 'cred-1',
    category: 'CREDENTIAL',
    verification_state: 'DERIVED',
    source_class: 'DERIVED_EXPLAINABLE',
    source_ref: { id: 'derive-1' },
    fact_payload: { title: 'شهادة مهنية', issuer: 'جهة مانحة' },
  }),
  makeCareerEvidence({
    evidence_id: 'award-1',
    category: 'AWARD',
    verification_state: 'DISPUTED',
    source_class: 'SELF_DECLARED',
    dispute_ref: { id: 'dispute-1' },
    fact_payload: { title: 'جائزة تميز' },
  }),
  makeCareerEvidence({
    evidence_id: 'lang-1',
    category: 'LANGUAGE',
    verification_state: 'CORRECTED',
    source_class: 'SELF_DECLARED',
    revision_no: 2,
    supersedes_evidence_id: 'lang-0',
    fact_payload: { name: 'الإنجليزية' },
  }),
  makeCareerEvidence({
    evidence_id: 'vol-1',
    category: 'VOLUNTEERING',
    verification_state: 'REVOKED',
    source_class: 'SELF_DECLARED',
    revocation_or_expiry_ref: { id: 'rev-1' },
    fact_payload: { organization: 'جمعية', role: 'متطوع' },
  }),
  makeCareerEvidence({
    evidence_id: 'pub-1',
    category: 'PUBLICATION',
    verification_state: 'EXPIRED',
    source_class: 'SELF_DECLARED',
    revocation_or_expiry_ref: { id: 'exp-ref-1' },
    fact_payload: { title: 'ورقة بحثية' },
  }),
  makeCareerEvidence({
    evidence_id: 'other-1',
    category: 'OTHER',
    verification_state: 'DECLARED',
    source_class: 'SYSTEM_OBSERVED',
    fact_payload: { title: 'نشاط قيادي' },
  }),
]
