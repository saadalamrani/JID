import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  assertZeroSideEffects,
  classifyLifecycle,
  dateOnlyDeadlineInRiyadh,
  findDuplicates,
  hostAllowed,
  INGEST_RECORD_KEYS,
  mapOrganization,
  normalizeOpportunityUrl,
  RESEARCH_INVENTORY,
  RESEARCH_NOW,
  runRealOpportunityDryRun,
  sourceAndApplyAreSeparated,
  toRegistrySourceType,
  validateResearchOpportunity,
} from '@/lib/lammah/real-opportunities'
import type { ResearchOpportunityInput } from '@/lib/lammah/real-opportunities/types'

const now = RESEARCH_NOW

function baseOpenJob(overrides: Partial<ResearchOpportunityInput> = {}): ResearchOpportunityInput {
  return {
    source_record_key: 'fixture-open-job',
    source_stable_id: 'fixture:req:1',
    raw_title: 'Software Engineer',
    title_ar: 'مهندس برمجيات',
    title_en: 'Software Engineer',
    raw_organization_name: 'Saudi Aramco',
    opportunity_type: 'job',
    source_url: 'https://careers.aramco.com/saudi/job/Software-Engineer/111/',
    apply_url: 'https://careers.aramco.com/saudi/job/Software-Engineer/111/',
    source_type: 'career_page',
    source_tier: 'A',
    official_source_hosts: ['aramco.com'],
    allowed_apply_hosts: ['aramco.com'],
    location_country: 'SA',
    location_region: 'eastern-province',
    location_city: 'Dhahran',
    sector_slug: 'energy-oil',
    qualification: 'Bachelor’s degree',
    specializations: 'Software Engineering',
    eligibility: 'Saudi applicant track',
    experience_requirement: null,
    work_mode: null,
    opens_at: '2026-01-01T00:00:00+03:00',
    deadline_at: '2026-12-31T00:00:00+03:00',
    deadline_precision: 'date_only',
    source_published_at: '2026-01-01T00:00:00+03:00',
    apply_cta_present: true,
    filled_or_closed_banner: false,
    evidence_note: 'Fixture',
    short_summary_ar: 'أرامكو السعودية تعلن عن وظيفة مهندس برمجيات.',
    short_summary_en: 'Saudi Aramco lists a software engineer role.',
    checked_at: '2026-08-23T03:45:00+03:00',
    ...overrides,
  }
}

describe('Lammah real-opportunity URL normalization', () => {
  it('normalizes hosts, strips fragments, and rejects generic homepages', () => {
    expect(
      normalizeOpportunityUrl('https://WWW.Careers.Aramco.com/saudi/job/Example/1/#top'),
    ).toBe('careers.aramco.com/saudi/job/Example/1')
    expect(normalizeOpportunityUrl('https://www.aramco.com/')).toBeNull()
    expect(normalizeOpportunityUrl('https://www.aramco.com/en/careers')).not.toBeNull()
    expect(normalizeOpportunityUrl('not-a-url')).toBeNull()
    expect(normalizeOpportunityUrl('https://careers.aramco.com/path with space')).toBeNull()
  })

  it('separates source and apply URLs without treating a homepage as an apply endpoint', () => {
    const separated = sourceAndApplyAreSeparated(
      'https://careers.aramco.com/saudi/job/Example/1',
      'https://careers.aramco.com/saudi/job/Example/1/apply',
    )
    expect(separated.identical).toBe(false)
    expect(separated.applyIsHomepage).toBe(false)
    expect(hostAllowed('https://careers.aramco.com/saudi/job/Example/1', ['aramco.com'])).toBe(true)
    expect(hostAllowed('https://jobs.aggregator.test/aramco', ['aramco.com'])).toBe(false)
  })
})

describe('Lammah real-opportunity lifecycle', () => {
  it('classifies open, upcoming, closed, and unknown without inventing a deadline', () => {
    expect(
      classifyLifecycle({
        now,
        opensAt: null,
        deadlineAt: '2026-12-31T00:00:00+03:00',
        applyCtaPresent: true,
        filledOrClosedBanner: false,
        sourceExplicitlyOpen: true,
      }),
    ).toBe('open')
    expect(
      classifyLifecycle({
        now,
        opensAt: '2026-09-01T00:00:00+03:00',
        deadlineAt: '2026-12-31T00:00:00+03:00',
        applyCtaPresent: false,
        filledOrClosedBanner: false,
        sourceExplicitlyOpen: false,
      }),
    ).toBe('upcoming')
    expect(
      classifyLifecycle({
        now,
        opensAt: null,
        deadlineAt: '2026-06-29T15:00:00+03:00',
        applyCtaPresent: true,
        filledOrClosedBanner: false,
        sourceExplicitlyOpen: true,
      }),
    ).toBe('closed')
    expect(
      classifyLifecycle({
        now,
        opensAt: null,
        deadlineAt: null,
        applyCtaPresent: false,
        filledOrClosedBanner: false,
        sourceExplicitlyOpen: false,
      }),
    ).toBe('unknown')
    expect(dateOnlyDeadlineInRiyadh('2026-12-31')).toBe('2026-12-31T00:00:00+03:00')
  })

  it('treats a filled banner as closed even if the page is still reachable', () => {
    const validated = validateResearchOpportunity(
      baseOpenJob({ filled_or_closed_banner: true, apply_cta_present: false }),
      now,
    )
    expect(validated.lifecycle_status).toBe('closed')
    expect(validated.publication_readiness).toBe('EXCLUDED_CLOSED')
  })
})

describe('Lammah real-opportunity contract validation', () => {
  it('keeps missing optional fields absent and does not invent them', () => {
    const validated = validateResearchOpportunity(
      baseOpenJob({
        location_city: null,
        work_mode: null,
        deadline_at: null,
        deadline_precision: 'absent',
        qualification: null,
        specializations: null,
      }),
      now,
    )
    expect(validated.location_city).toBeNull()
    expect(validated.work_mode).toBeNull()
    expect(validated.deadline_at).toBeNull()
    expect(validated.qualification).toBeNull()
    expect(validated.lifecycle_status).toBe('open')
  })

  it('quarantines malformed sources and unknown lifecycle', () => {
    const malformed = validateResearchOpportunity(
      baseOpenJob({
        source_url: 'https://www.aramco.com/',
        apply_url: 'https://www.aramco.com/',
      }),
      now,
    )
    expect(malformed.review_flags).toContain('malformed_source')
    expect(malformed.publication_readiness).toBe('EXCLUDED_MALFORMED')

    const unknown = validateResearchOpportunity(
      baseOpenJob({
        apply_cta_present: false,
        deadline_at: null,
        deadline_precision: 'absent',
      }),
      now,
    )
    expect(unknown.lifecycle_status).toBe('unknown')
    expect(unknown.publication_readiness).toBe('EXCLUDED_UNKNOWN')
  })

  it('excludes Tier C-only leads from publish-review inventory', () => {
    const validated = validateResearchOpportunity(
      baseOpenJob({
        source_tier: 'C',
        official_source_hosts: ['example-jobs-aggregator.test'],
        allowed_apply_hosts: ['example-jobs-aggregator.test'],
        source_url: 'https://example-jobs-aggregator.test/job/1',
        apply_url: 'https://example-jobs-aggregator.test/job/1',
        raw_organization_name: 'Unknown aggregator',
      }),
      now,
    )
    expect(validated.publication_readiness).toBe('EXCLUDED_TIER_C_ONLY')
  })
})

describe('Lammah real-opportunity organization mapping', () => {
  it('maps Aramco by official domain without creating a Directory row or Profile', () => {
    const mapping = mapOrganization({
      organizationName: 'Saudi Aramco',
      sourceUrl: 'https://careers.aramco.com/saudi/job/Example/1',
      applyUrl: 'https://careers.aramco.com/saudi/job/Example/1',
    })
    expect(mapping.method).toBe('official_domain')
    expect(mapping.directoryCompanyId).toBeNull()
    expect(mapping.catalogOrgDependency).toBe(true)
    expect(mapping.status).toBe('mapped_pending_catalog_uuid')
  })

  it('marks unresolved organizations as ORG_MAPPING_REQUIRED without inventing a company', () => {
    const mapping = mapOrganization({
      organizationName: 'Elm',
      sourceUrl: 'https://career.elm.sa/elm/job/Example/1',
      applyUrl: 'https://career.elm.sa/elm/job/Example/1',
    })
    expect(mapping.status).toBe('ORG_MAPPING_REQUIRED')
    expect(mapping.directoryCompanyId).toBeNull()
  })
})

describe('Lammah real-opportunity deduplication', () => {
  it('does not merge distinct requisitions that share a similar title', () => {
    const first = validateResearchOpportunity(baseOpenJob(), now)
    const second = validateResearchOpportunity(
      baseOpenJob({
        source_record_key: 'fixture-open-job-2',
        source_stable_id: 'fixture:req:2',
        apply_url: 'https://careers.aramco.com/saudi/job/Software-Engineer/222/',
        source_url: 'https://careers.aramco.com/saudi/job/Software-Engineer/222/',
      }),
      now,
    )
    const duplicates = findDuplicates([first, second])
    expect(duplicates.some((item) => item.merge)).toBe(false)
  })

  it('detects an identical official apply URL as a mergeable duplicate', () => {
    const first = validateResearchOpportunity(baseOpenJob(), now)
    const second = validateResearchOpportunity(
      baseOpenJob({
        source_record_key: 'fixture-open-job-copy',
        source_stable_id: 'fixture:req:copy',
      }),
      now,
    )
    const duplicates = findDuplicates([first, second])
    expect(duplicates.some((item) => item.merge && item.signals.includes('normalized_apply_url'))).toBe(true)
  })

  it('is idempotent for the same checksum', () => {
    const first = validateResearchOpportunity(baseOpenJob(), now)
    const second = validateResearchOpportunity(baseOpenJob(), now)
    expect(first.checksum_sha256).toBe(second.checksum_sha256)
    expect(first.duplicate_key).toBe(second.duplicate_key)
  })
})

describe('Lammah real-opportunity dry-run import', () => {
  it('prepares current official Saudi inventory without remote writes or Profile side effects', () => {
    const report = runRealOpportunityDryRun({
      inputs: RESEARCH_INVENTORY,
      now,
      generatedAt: '2026-08-23T03:45:00+03:00',
    })
    assertZeroSideEffects(report)
    expect(report.remote_write).toBe(false)
    expect(report.side_effects.companies_created).toBe(0)
    expect(report.side_effects.business_profiles).toBe(0)
    expect(report.side_effects.university_profiles).toBe(0)
    expect(report.side_effects.verification_requests).toBe(0)
    expect(report.side_effects.abhathli).toBe(0)
    expect(report.candidates.length).toBeGreaterThanOrEqual(8)
    expect(report.candidates.length).toBeLessThanOrEqual(20)
    expect(report.candidates.every((item) => item.lifecycle_status === 'open' || item.lifecycle_status === 'upcoming')).toBe(true)
    expect(report.candidates.every((item) => item.source_tier === 'A' || item.source_tier === 'B')).toBe(true)
    expect(report.excluded.some((item) => item.source_record_key === 'stc-contract-management-expert-filled')).toBe(true)
    expect(report.excluded.some((item) => item.source_record_key === 'pif-gdp-application-closed')).toBe(true)
    expect(report.excluded.some((item) => item.source_record_key === 'aggregator-lead-rejected-tier-c')).toBe(true)
    expect(report.source_proposals.every((source) => source.approval_state === 'candidate')).toBe(true)
    expect(report.source_proposals.every((source) => source.auto_publication_enabled === false)).toBe(true)
    expect(
      report.source_proposals.every(
        (source) => source.source_type === 'career_page' || source.source_type === 'official_program',
      ),
    ).toBe(true)
    expect(toRegistrySourceType('official_government_portal')).toBe('official_program')
    expect(report.source_proposals.some((source) => source.base_url.includes('example-jobs-aggregator'))).toBe(false)
    expect(report.ingest_records).toHaveLength(report.candidates.length)
    expect(
      report.ingest_records.every((record) => Object.keys(record).length === INGEST_RECORD_KEYS.length),
    ).toBe(true)
    expect(report.ingest_records.every((record) => record.content_type === 'application/json')).toBe(true)
  })
})

describe('Lammah ingest host-allowlist gap', () => {
  it('keeps the current EU-only source-page hardcode documented and adds a per-source column', () => {
    const workflows = readFileSync(
      join(process.cwd(), 'supabase/migrations/20260803120200_lammah_phase1_workflows.sql'),
      'utf8',
    )
    const next = readFileSync(
      join(process.cwd(), 'supabase/migrations/20260823120000_lammah_source_host_allowlist.sql'),
      'utf8',
    )
    expect(workflows).toContain("lammah_host_allowed(v_source_url,ARRAY['europa.eu'])")
    expect(next).toContain('allowed_source_hosts')
    expect(next).toContain('lammah_resolved_source_hosts')
    expect(next).toContain('lammah_begin_source_run')
    expect(next).not.toContain('DROP TABLE')
    expect(next).not.toContain('claimed_by')
    expect(workflows).toContain("WHERE source_key = 'eu_careers_cast'")
  })
})
