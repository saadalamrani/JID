import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  UNIVERSITY_AFFILIATION_STATES,
  UNIVERSITY_IDENTITY_MAPPING_STATES,
  UNIVERSITY_OUTCOME_PRESENCE,
  UNIVERSITY_OUTCOME_SOURCES,
} from '@/types/contracts/university'
import { affiliationImpliesCareerRecordAccess } from '@/features/career-record/privacy'

function load(locale: 'ar' | 'en') {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8')) as {
    university: { dashboard: { unmapped: Record<string, unknown>; foundation: Record<string, unknown> } }
    profile: { affiliation: Record<string, unknown> }
    staff: { universityFoundation: Record<string, unknown> }
  }
}

function keys(value: Record<string, unknown>): string[] {
  return Object.keys(value).sort()
}

describe('Wave 10 University foundation contracts', () => {
  it('keeps affiliation and mapping states explicit', () => {
    expect(UNIVERSITY_AFFILIATION_STATES).toEqual(['DECLARED', 'VERIFIED', 'NEEDS_REVIEW'])
    expect(UNIVERSITY_IDENTITY_MAPPING_STATES).toEqual(['active', 'revoked'])
    expect(UNIVERSITY_OUTCOME_PRESENCE).toEqual(['KNOWN', 'UNKNOWN'])
    expect(UNIVERSITY_OUTCOME_SOURCES).toContain('USER_DECLARED')
    expect(affiliationImpliesCareerRecordAccess()).toBe(false)
  })

  it('keeps AR/EN parity for Wave 10 surfaces', () => {
    const en = load('en')
    const ar = load('ar')
    expect(keys(en.university.dashboard.unmapped)).toEqual(keys(ar.university.dashboard.unmapped))
    expect(keys(en.university.dashboard.foundation)).toEqual(keys(ar.university.dashboard.foundation))
    expect(keys(en.profile.affiliation)).toEqual(keys(ar.profile.affiliation))
    expect(keys(en.staff.universityFoundation)).toEqual(keys(ar.staff.universityFoundation))
  })

  it('does not advertise employment rate or ranking copy', () => {
    const en = JSON.stringify(load('en'))
    const ar = JSON.stringify(load('ar'))
    expect(en).not.toMatch(/median time-to-employment|program ranking|graduate success score/i)
    expect(ar).not.toMatch(/معدل التوظيف %|ترتيب البرامج/)
  })

  it('ships identity mapping SQL without collapsing identity spaces', () => {
    const sql = readFileSync(
      join(process.cwd(), 'supabase/migrations/20260831140000_wave10_university_foundation.sql'),
      'utf8',
    )
    expect(sql).toContain('university_identity_mappings')
    expect(sql).toContain('universities_catalog')
    expect(sql).toContain('directory_id')
    expect(sql).toContain('is_privileged_staff()')
    expect(sql).toContain("fail_closed_reason', 'unmapped'")
    expect(sql).not.toMatch(/employment_rate\s+=/)
    expect(sql).toContain('CONTRACT_ONLY')
    expect(sql).toContain('NO RESPONSE')
  })
})
