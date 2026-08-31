import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260831141037_wave11_university_intelligence.sql'),
  'utf8',
)

describe('Wave 11 University intelligence truth contract', () => {
  it('computes coverage from distinct eligible members without inventing employment rate', () => {
    expect(sql).toContain('count(DISTINCT m.individual_id)')
    expect(sql).toContain("o.presence='KNOWN'")
    expect(sql).toContain('known_outcome_coverage')
    expect(sql).not.toMatch(/alignment_score|match_percentage|readiness_score/i)
  })

  it('suppresses small groups through explicit product configuration', () => {
    expect(sql).toContain('minimum_group_size')
    expect(sql).toContain('suppression_is_product_configuration')
    expect(sql).toContain('not a legal or regulatory threshold')
    expect(sql).toContain('CASE WHEN v_suppressed THEN NULL')
  })

  it('keeps alignment explicit and readiness operational', () => {
    expect(sql).toContain('university_program_alignment_evidence')
    expect(sql).toContain('provenance_ref')
    expect(sql).toContain("j.status IN ('published','closing_soon')")
    expect(sql).toContain('university_readiness_activities')
    expect(sql).toContain('participation_count')
  })

  it('returns aggregate owner data without named graduate fields', () => {
    const snapshot = sql.slice(sql.indexOf('university_owner_intelligence_snapshot'))
    expect(snapshot).not.toContain("'individual_id'")
    expect(snapshot).not.toContain("'email'")
    expect(snapshot).not.toContain("'cv'")
    expect(snapshot).toContain('current_mapped_catalog_university_id')
  })

  it('keeps Arabic and English intelligence keys in parity', () => {
    const ar = JSON.parse(readFileSync(join(process.cwd(), 'messages/ar.json'), 'utf8'))
    const en = JSON.parse(readFileSync(join(process.cwd(), 'messages/en.json'), 'utf8'))
    expect(Object.keys(ar.university.dashboard.intelligence).sort()).toEqual(
      Object.keys(en.university.dashboard.intelligence).sort(),
    )
  })
})
