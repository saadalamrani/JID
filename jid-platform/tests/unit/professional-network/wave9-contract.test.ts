import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
const sql = readFileSync(
  resolve('supabase/migrations/20260831130000_wave9_governed_professional_network.sql'),
  'utf8',
)
describe('Wave 9 network', () => {
  it('is chronological and relationship scoped', () => {
    expect(sql).toContain("u.audience='connections' AND public.wave9_connected")
    expect(sql).toContain('ORDER BY u.created_at DESC')
    expect(sql).not.toMatch(/like_count|reaction_count|engagement_score|boost|sponsor|rank_score/i)
  })
  it('keeps discovery independent', () => {
    expect(sql).not.toMatch(/show_profile_to_companies\s*=/i)
    expect(sql).not.toMatch(/visibility\s*=/i)
    expect(sql).not.toMatch(/career_record/i)
  })
  it('is RPC-only', () => {
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('FROM PUBLIC,anon,authenticated')
  })
})
