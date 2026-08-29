import { describe, expect, it } from 'vitest'
import {
  externalOpportunityId,
  mapLammahCardToDiscoveryItem,
  mapLammahTypeToFamily,
  mapNativeJobToDiscoveryItem,
  nativeOpportunityId,
  parseOpportunityId,
  sortOpportunityDiscovery,
  sourceAllowsAutomatedPublication,
  sourceIsCandidateOnly,
  sourceIsProhibitedOrUnsupported,
  type OpportunityDiscoveryItem,
} from '@/lib/opportunity'
import type { JobCardData } from '@/types/job'
import type { LammahOpportunityCard } from '@/types/lammah'

function nativeFixture(overrides: Partial<JobCardData> = {}): JobCardData {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    business_profile_id: '22222222-2222-4222-8222-222222222222',
    slug: 'example-job',
    title_ar: 'مهندس برمجيات',
    title_en: 'Software Engineer',
    experience_level: 'entry',
    status: 'active',
    city: 'Riyadh',
    is_remote: false,
    salary_min: null,
    salary_max: null,
    salary_currency: 'SAR',
    application_deadline: '2026-09-30T20:59:59.999Z',
    deadlineDaysLeft: 30,
    published_at: '2026-08-01T10:00:00.000Z',
    applicant_count: 0,
    applyUrl: 'https://employer.example/careers/1',
    company: {
      id: '33333333-3333-4333-8333-333333333333',
      name_en: 'Example Co',
      name_ar: 'شركة مثال',
      slug: 'example-co',
      logo_url: null,
      ownership_type: 'private',
      career_portal_url: null,
    },
    sector: null,
    region: { slug: 'riyadh', name_en: 'Riyadh', name_ar: 'الرياض' },
    tier: 'normal',
    isBoosted: true,
    boostStartsAt: null,
    boostEndsAt: null,
    ...overrides,
  }
}

function lammahFixture(overrides: Partial<LammahOpportunityCard> = {}): LammahOpportunityCard {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    sourceId: '55555555-5555-4555-8555-555555555555',
    sourceName: 'Employer Careers',
    companyId: '66666666-6666-4666-8666-666666666666',
    companyNameRaw: 'Raw Org Name',
    titleAr: 'تدريب تعاوني',
    titleEn: 'Co-op Programme',
    excerpt: 'Source-backed excerpt',
    sector: 'technology',
    region: 'riyadh',
    locationCountry: 'SA',
    locationCity: 'Riyadh',
    ownershipType: 'private',
    experienceLevel: 'entry',
    opportunityType: 'co_op',
    externalUrl: 'https://employer.example/apply/9',
    sourcePublishedAt: '2026-08-10T08:00:00.000Z',
    scrapedAt: '2026-08-20T08:00:00.000Z',
    expiresAt: '2026-09-15T20:59:59.999Z',
    lastConfirmedAt: '2026-08-28T08:00:00.000Z',
    status: 'active',
    extractionConfidence: 1,
    companyLogoUrl: null,
    ...overrides,
  }
}

describe('Opportunity discovery contract', () => {
  it('maps native jobs as JOB family with JID_NATIVE provenance', () => {
    const item = mapNativeJobToDiscoveryItem(nativeFixture())
    expect(item.opportunity_id).toBe(
      nativeOpportunityId('11111111-1111-4111-8111-111111111111'),
    )
    expect(item.opportunity_family).toBe('JOB')
    expect(item.source_class).toBe('JID_NATIVE')
    expect(item.apply_authority).toBe('JID_NATIVE')
    expect(item.lifecycle_state).toBe('PUBLISHED')
    expect(item.title.ar).toBe('مهندس برمجيات')
    expect('isBoosted' in item).toBe(false)
    expect(parseOpportunityId(item.opportunity_id)).toEqual({
      source_class: 'JID_NATIVE',
      record_id: '11111111-1111-4111-8111-111111111111',
    })
  })

  it('preserves Lammah opportunity families and external provenance', () => {
    expect(mapLammahTypeToFamily('internship')).toBe('INTERNSHIP')
    expect(mapLammahTypeToFamily('scholarship')).toBe('SCHOLARSHIP')
    const item = mapLammahCardToDiscoveryItem(lammahFixture(), {
      sourceApprovalState: 'approved',
      sourcePageUrl: 'https://employer.example/careers/listing/9',
    })
    expect(item.opportunity_family).toBe('COOP')
    expect(item.source_class).toBe('GOVERNED_EXTERNAL')
    expect(item.apply_authority).toBe('OFFICIAL_EXTERNAL')
    expect(item.apply_url).toBe('https://employer.example/apply/9')
    expect(item.source_url).toBe('https://employer.example/careers/listing/9')
    expect(item.source_url).not.toBe(item.apply_url)
    expect(item.source_approval_state).toBe('approved')
    expect(item.organization_name).toBe('Raw Org Name')
    expect(item.opportunity_id).toBe(
      externalOpportunityId('44444444-4444-4444-8444-444444444444'),
    )
  })

  it('allows source_url to equal apply_url when source page is absent', () => {
    const item = mapLammahCardToDiscoveryItem(lammahFixture({ opportunityType: 'internship' }))
    expect(item.opportunity_family).toBe('INTERNSHIP')
    expect(item.source_url).toBe(item.apply_url)
  })

  it('omits missing optional fields instead of coercing zeros', () => {
    const item = mapNativeJobToDiscoveryItem(
      nativeFixture({
        city: null,
        applyUrl: null,
        published_at: null,
        title_en: null,
        region: null,
      }),
    )
    expect(item.location?.city).toBeUndefined()
    expect(item.apply_url).toBeUndefined()
    expect(item.published_at).toBeUndefined()
    expect(item.title.en).toBeUndefined()
    expect(item.title.ar).toBe('مهندس برمجيات')
  })

  it('keeps unresolved external organization mapping honest', () => {
    const item = mapLammahCardToDiscoveryItem(
      lammahFixture({ companyId: null, companyNameRaw: 'Unknown Org From Source' }),
    )
    expect(item.organization_ref_id).toBeUndefined()
    expect(item.organization_name).toBe('Unknown Org From Source')
  })

  it('enforces source rights conceptual gates', () => {
    expect(sourceAllowsAutomatedPublication('approved')).toBe(true)
    expect(sourceAllowsAutomatedPublication('candidate')).toBe(false)
    expect(sourceIsCandidateOnly('candidate')).toBe(true)
    expect(sourceIsProhibitedOrUnsupported('prohibited')).toBe(true)
    expect(sourceIsProhibitedOrUnsupported('unsupported')).toBe(true)
  })

  it('sorts deterministically by deadline then freshness then id without boost/match', () => {
    const a: OpportunityDiscoveryItem = {
      ...mapNativeJobToDiscoveryItem(
        nativeFixture({
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          application_deadline: '2026-10-01T00:00:00.000Z',
          published_at: '2026-08-01T00:00:00.000Z',
        }),
      ),
    }
    const b = mapLammahCardToDiscoveryItem(
      lammahFixture({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        expiresAt: '2026-09-01T00:00:00.000Z',
        lastConfirmedAt: '2026-08-20T00:00:00.000Z',
      }),
    )
    const c = mapLammahCardToDiscoveryItem(
      lammahFixture({
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        expiresAt: '2026-09-01T00:00:00.000Z',
        lastConfirmedAt: '2026-08-25T00:00:00.000Z',
      }),
    )
    const sorted = sortOpportunityDiscovery([a, b, c])
    expect(sorted.map((item) => item.opportunity_id)).toEqual([
      externalOpportunityId('cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
      externalOpportunityId('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
      nativeOpportunityId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
    ])
  })
})
