import { describe, expect, it } from 'vitest'
import { operationalStateFromApplicationStatus, mayLinkApplication } from '@/lib/career-operations/application-bridge'
import { classifyAttentionBuckets } from '@/lib/career-operations/attention'
import { buildCareerIntelligenceInsights } from '@/lib/career-operations/intelligence'
import { mergeCareerItemsWithApplications } from '@/lib/career-operations/merge-board'
import { APPLICATION_STATUSES, type UserApplication } from '@/types/application'
import type { CareerItem } from '@/lib/career-operations/types'

function item(overrides: Partial<CareerItem>): CareerItem {
  return {
    id: 'item-1',
    origin: 'career_item',
    user_id: 'user-1',
    opportunity_id: 'external:1',
    source_class: 'GOVERNED_EXTERNAL',
    opportunity_family: 'JOB',
    application_id: null,
    application_status: null,
    operational_state: 'considering',
    outcome_kind: null,
    title_ar: 'محلل بيانات',
    title_en: 'SQL analyst',
    organization_name: 'Acme',
    deadline_at: null,
    apply_authority: 'OFFICIAL_EXTERNAL',
    apply_url: 'https://example.com/apply',
    next_action: null,
    open_follow_ups: [],
    interviews: [],
    latest_events: [],
    last_user_action_at: null,
    last_employer_action_at: null,
    last_system_event_at: null,
    last_seen_at: null,
    note_count: 0,
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('Wave 4 application contract preservation', () => {
  it('does not add or remove Application statuses', () => {
    expect(APPLICATION_STATUSES).toEqual([
      'draft',
      'saved',
      'pending',
      'submitted',
      'under_review',
      'shortlisted',
      'rejected',
      'invited',
      'withdrawn',
      'expired',
    ])
  })

  it('maps application status without inventing employer hiring stages', () => {
    expect(operationalStateFromApplicationStatus('saved')).toBe('considering')
    expect(operationalStateFromApplicationStatus('submitted')).toBe('applied')
    expect(operationalStateFromApplicationStatus('invited')).toBe('interviewing')
    expect(operationalStateFromApplicationStatus('rejected')).toBe('outcome')
  })

  it('forbids linking GOVERNED_EXTERNAL opportunities to applications', () => {
    expect(mayLinkApplication('JID_NATIVE')).toBe(true)
    expect(mayLinkApplication('GOVERNED_EXTERNAL')).toBe(false)
  })
})

describe('Career operations attention', () => {
  it('surfaces due actions without inventing counts', () => {
    const due = item({
      next_action: {
        id: 'a1',
        kind: 'follow_up',
        label: 'Follow up',
        due_at: '2026-08-28T00:00:00.000Z',
        completed_at: null,
        is_follow_up: true,
      },
    })
    const buckets = classifyAttentionBuckets([due], new Date('2026-08-29T00:00:00.000Z'))
    expect(buckets.needs_attention.map((entry) => entry.id)).toEqual(['item-1'])
  })

  it('treats employer action after last seen as changed', () => {
    const changed = item({
      last_employer_action_at: '2026-08-29T10:00:00.000Z',
      last_seen_at: '2026-08-28T10:00:00.000Z',
    })
    const buckets = classifyAttentionBuckets([changed], new Date('2026-08-29T12:00:00.000Z'))
    expect(buckets.changed).toHaveLength(1)
  })
})

describe('Career intelligence', () => {
  it('explains token frequency against Career Record evidence instead of a match percent', () => {
    const insights = buildCareerIntelligenceInsights({
      items: [
        item({ id: '1', title_en: 'SQL analyst' }),
        item({ id: '2', title_en: 'SQL engineer' }),
      ],
      careerRecordTokens: ['python'],
      timeWindowLabelAr: 'الآن',
      timeWindowLabelEn: 'current Radar',
    })
    const sql = insights.find((entry) => entry.token === 'sql')
    expect(sql).toBeTruthy()
    expect(sql?.evidenced_in_career_record).toBe(false)
    expect(sql?.statement_en).toMatch(/not currently evidenced/i)
    expect(sql?.statement_en).not.toMatch(/%/)
    expect(sql?.source_population_size).toBe(2)
  })
})

describe('Board merge', () => {
  it('projects native applications that have no career_item yet', () => {
    const application = {
      id: 'app-1',
      job_id: 'job-1',
      applicant_id: 'user-1',
      company_id: 'co-1',
      status: 'submitted',
      cover_letter: null,
      resume_url: null,
      contact_email: null,
      submitted_at: '2026-08-20T00:00:00.000Z',
      last_company_action_at: null,
      last_seen_by_user_at: null,
      status_changed_at: null,
      status_changed_by: null,
      expires_at: null,
      created_at: '2026-08-20T00:00:00.000Z',
      updated_at: '2026-08-20T00:00:00.000Z',
      job: {
        id: 'job-1',
        slug: 'job-1',
        title_ar: 'محلل',
        title_en: 'Analyst',
        application_deadline: '2026-09-01T00:00:00.000Z',
      },
      company: {
        id: 'co-1',
        slug: 'co',
        name_en: 'Acme',
        name_ar: 'أكمي',
        logo_url: null,
      },
    } satisfies UserApplication

    const merged = mergeCareerItemsWithApplications([], [application], '2026-08-29T00:00:00.000Z')
    expect(merged).toHaveLength(1)
    expect(merged[0]?.origin).toBe('application_projection')
    expect(merged[0]?.application_id).toBe('app-1')
    expect(merged[0]?.source_class).toBe('JID_NATIVE')
  })
})
