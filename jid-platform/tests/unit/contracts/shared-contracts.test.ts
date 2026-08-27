import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { actorCompatibilityFromLegacyRole } from '@/lib/auth/rbac'
import {
  AUTHORIZATION_BASIS_TYPES,
  CAREER_EVIDENCE_STATES,
  JOURNEY_EVENT_ORIGINS,
  OPPORTUNITY_TYPES,
  ORGANIZATION_TYPES,
  PUBLIC_ACTOR_TYPES,
  SHARED_CONTRACT_VERSION,
  UNIVERSITY_AFFILIATION_STATES,
  isJourneyOutcome,
  isPublicActorType,
} from '@/types/contracts'
import type {
  AssessmentDecisionUse,
  AuthorizedCareerEvidenceDisclosure,
  AutomationAuthority,
  CareerEvidence,
  CohortLink,
  ConsequentialExternalAutomationAuthority,
  DisclosureAuthorization,
  MarketContext,
  MetricDefinition,
  Opportunity,
  OrganicOpportunityRelevance,
  OrganizationAuthority,
  OrganizationReference,
  UniversityAffiliation,
} from '@/types/contracts'
import type { ContractReference } from '@/types/contracts/common'
import type { CvRecord } from '@/types/cv'
import type { Job } from '@/types/job'

describe('Wave 1 canonical contract invariants', () => {
  it('freezes exactly the three founder-approved public actors', () => {
    expect(PUBLIC_ACTOR_TYPES).toEqual(['INDIVIDUAL', 'BUSINESS', 'UNIVERSITY'])
    expect(isPublicActorType('MENTOR')).toBe(false)
    expect(isPublicActorType('GOVERNMENT')).toBe(false)
    expect(actorCompatibilityFromLegacyRole('entity')).toBeNull()
    expect(actorCompatibilityFromLegacyRole('staff')).toBeNull()
    expect(actorCompatibilityFromLegacyRole('company_admin')).toEqual({
      actor_type: 'BUSINESS',
      organization_authority_required: true,
    })
  })

  it('keeps Directory identity distinct from organization authority', () => {
    expect(ORGANIZATION_TYPES).toEqual(['BUSINESS', 'UNIVERSITY'])
    expectTypeOf<OrganizationReference>().not.toEqualTypeOf<OrganizationAuthority>()
    expectTypeOf<OrganizationAuthority>().toHaveProperty('verification_ref')
    expectTypeOf<OrganizationReference>().not.toHaveProperty('authority_role')
  })

  it('supports declared, verified, disputed, corrected, revoked, and expired evidence lineage', () => {
    expect(CAREER_EVIDENCE_STATES).toEqual(
      expect.arrayContaining([
        'DECLARED',
        'VERIFIED',
        'DISPUTED',
        'CORRECTED',
        'REVOKED',
        'EXPIRED',
      ]),
    )
    expectTypeOf<CareerEvidence>().toHaveProperty('revision_no')
    expectTypeOf<CareerEvidence>().toHaveProperty('supersedes_evidence_id')
    expectTypeOf<CareerEvidence>().toHaveProperty('dispute_ref')
    expectTypeOf<CareerEvidence>().toHaveProperty('revocation_or_expiry_ref')
    expectTypeOf<CareerEvidence['disclosure_policy_ref']>().toEqualTypeOf<ContractReference>()
    expectTypeOf<CareerEvidence['disclosure_authorization_ref']>().toEqualTypeOf<
      ContractReference | undefined
    >()
    expectTypeOf<CareerEvidence>().toHaveProperty('evidence_artifact_ref')
  })

  it('separates required evidence policy from conditional C5 disclosure authorization', () => {
    expectTypeOf<CareerEvidence>().toHaveProperty('disclosure_policy_ref')
    expectTypeOf<CareerEvidence['disclosure_authorization_ref']>().toEqualTypeOf<
      ContractReference | undefined
    >()

    expectTypeOf<
      AuthorizedCareerEvidenceDisclosure<'PUBLIC'>['evidence']['disclosure_authorization_ref']
    >().toEqualTypeOf<ContractReference>()
    expectTypeOf<
      AuthorizedCareerEvidenceDisclosure<'PUBLIC'>['authorization']['purpose_code']
    >().toEqualTypeOf<string>()
    expectTypeOf<AuthorizedCareerEvidenceDisclosure<'PUBLIC'>['authorization']>().toHaveProperty(
      'basis',
    )
    expectTypeOf<AuthorizedCareerEvidenceDisclosure<'PUBLIC'>['authorization']>().toHaveProperty(
      'lifecycle',
    )
    expectTypeOf<AuthorizedCareerEvidenceDisclosure<'PUBLIC'>['authorization']>().toHaveProperty(
      'retention_policy_ref',
    )
    expectTypeOf<
      AuthorizedCareerEvidenceDisclosure<'PUBLIC'>['authorization']['recipient']['recipient_type']
    >().toEqualTypeOf<'PUBLIC'>()

    expectTypeOf<
      AuthorizedCareerEvidenceDisclosure<'BUSINESS'>['authorization']['recipient']['recipient_ref']
    >().toEqualTypeOf<ContractReference>()
    expectTypeOf<
      AuthorizedCareerEvidenceDisclosure<'BUSINESS'>['authorization']['purpose_code']
    >().toEqualTypeOf<string>()

    expectTypeOf<UniversityAffiliation>().not.toHaveProperty('career_evidence')
    expectTypeOf<UniversityAffiliation>().not.toHaveProperty('disclosure_authorization_ref')
  })

  it('supports non-job opportunities and preserves source and apply authority', () => {
    expect(OPPORTUNITY_TYPES).toEqual(
      expect.arrayContaining(['INTERNSHIP', 'COOP', 'FELLOWSHIP', 'SCHOLARSHIP', 'TRAINING']),
    )
    expectTypeOf<Opportunity>().toHaveProperty('source')
    expectTypeOf<Opportunity>().toHaveProperty('apply_authority')
    expectTypeOf<Opportunity>().toHaveProperty('apply_destination')
  })

  it('uses exact event origins and never treats missing data as an outcome', () => {
    expect(JOURNEY_EVENT_ORIGINS).toEqual([
      'USER_DECLARED',
      'SYSTEM_OBSERVED',
      'EMPLOYER_CONFIRMED',
      'INSTITUTION_CONFIRMED',
      'THIRD_PARTY_SOURCED',
      'ADMIN_CORRECTION',
    ])
    expect(isJourneyOutcome('MISSING')).toBe(false)
    expect(isJourneyOutcome('UNKNOWN')).toBe(false)
    expect(isJourneyOutcome('NO_DATA')).toBe(false)
  })

  it('requires purpose, scope, recipient, basis, lifecycle, and retention for disclosure', () => {
    expect(AUTHORIZATION_BASIS_TYPES).toContain('CONSENT')
    expect(AUTHORIZATION_BASIS_TYPES).toContain('CONTRACT')
    expect(AUTHORIZATION_BASIS_TYPES).toContain('LEGAL_OBLIGATION')
    expectTypeOf<DisclosureAuthorization>().toHaveProperty('purpose_code')
    expectTypeOf<DisclosureAuthorization>().toHaveProperty('recipient')
    expectTypeOf<DisclosureAuthorization>().toHaveProperty('basis')
    expectTypeOf<DisclosureAuthorization>().toHaveProperty('lifecycle')
    expectTypeOf<DisclosureAuthorization>().toHaveProperty('retention_policy_ref')
  })

  it('keeps affiliation states exact and cohort linkage separate', () => {
    expect(UNIVERSITY_AFFILIATION_STATES).toEqual(['DECLARED', 'VERIFIED', 'NEEDS_REVIEW'])
    expectTypeOf<UniversityAffiliation>().not.toEqualTypeOf<CohortLink>()
    expectTypeOf<CohortLink>().not.toHaveProperty('disclosure_authorization_ref')
  })

  it('exposes no universal assessment score or autonomous final hiring authority', () => {
    expectTypeOf<AssessmentDecisionUse>().not.toHaveProperty('candidate_score')
    expectTypeOf<AssessmentDecisionUse>().not.toHaveProperty('employability_score')
    expectTypeOf<AssessmentDecisionUse>().not.toHaveProperty('culture_fit_score')
    expectTypeOf<AssessmentDecisionUse>().not.toHaveProperty('potential_score')
    expectTypeOf<AssessmentDecisionUse>().not.toHaveProperty('automated_final_decision')
    expectTypeOf<AssessmentDecisionUse>().toHaveProperty('human_reviewer_ref')
  })

  it('requires approval and confirmation for consequential external automation', () => {
    expectTypeOf<
      ConsequentialExternalAutomationAuthority['human_review_state']
    >().toEqualTypeOf<'APPROVED'>()
    expectTypeOf<ConsequentialExternalAutomationAuthority>().toHaveProperty(
      'external_confirmation_ref',
    )
    expectTypeOf<AutomationAuthority>().not.toHaveProperty('autonomous_final_decision')
  })

  it('supports Saudi use without hard-coding Saudi as universal market truth', () => {
    const anotherMarket: MarketContext = {
      contract_version: SHARED_CONTRACT_VERSION,
      jurisdiction_code: 'AE',
      locale: 'ar-AE',
    }
    expect(anotherMarket.jurisdiction_code).toBe('AE')
  })

  it('requires metric source, population/window, coverage, missingness, and privacy semantics', () => {
    expectTypeOf<MetricDefinition>().toHaveProperty('source_refs')
    expectTypeOf<MetricDefinition>().toHaveProperty('population_definition')
    expectTypeOf<MetricDefinition>().toHaveProperty('window_definition')
    expectTypeOf<MetricDefinition>().toHaveProperty('coverage')
    expectTypeOf<MetricDefinition>().toHaveProperty('missing_unknown_policy')
    expectTypeOf<MetricDefinition>().toHaveProperty('privacy')
  })

  it('does not silently make legacy Job, CV, or SSIS semantics canonical', () => {
    expectTypeOf<Job>().not.toEqualTypeOf<Opportunity>()
    expectTypeOf<CvRecord>().not.toEqualTypeOf<CareerEvidence>()
    const barrel = readFileSync(join(process.cwd(), 'src/types/contracts/index.ts'), 'utf8')
    expect(barrel).not.toMatch(/from ['"]\.\.\/job['"]/)
    expect(barrel).not.toMatch(/from ['"]\.\.\/cv['"]/)
    expect(barrel).not.toContain('composite_score')
    expect(barrel).not.toContain('decline_recommend')
  })

  it('keeps legacy backfill declared, private by policy, and free of fabricated authorization', () => {
    const subpacket = readFileSync(
      join(process.cwd(), 'docs/command-center/wave-2/WAVE_2_CAREER_RECORD_MIGRATION_SUBPACKET.md'),
      'utf8',
    )

    expect(subpacket).toContain('`SELF_DECLARED`/`DECLARED`')
    expect(subpacket).toContain('does not create a disclosure authorization')
    expect(subpacket).toContain('private-by-default disclosure policy')
  })

  it('keeps paid visibility out of organic relevance', () => {
    expectTypeOf<OrganicOpportunityRelevance>().not.toHaveProperty('is_boosted')
    expectTypeOf<OrganicOpportunityRelevance>().not.toHaveProperty('priority_visibility')
    expectTypeOf<OrganicOpportunityRelevance>().not.toHaveProperty('paid_tier')
  })
})
