import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260829140000_wave4_career_operations_private.sql'),
  'utf8',
)

describe('Wave 4 career operations migration contract', () => {
  it('keeps career operations user-private and does not grant employer roles', () => {
    expect(migration).toContain('ENABLE ROW LEVEL SECURITY')
    expect(migration).toContain('FORCE ROW LEVEL SECURITY')
    expect(migration).toContain('user_id = auth.uid()')
    expect(migration).toContain('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated')
    expect(migration).not.toMatch(/TO\s+company_admin/i)
    expect(migration).not.toMatch(/business_profile_id/i)
    expect(migration).not.toMatch(/CREATE POLICY[\s\S]*company_id/i)
  })

  it('forbids linking external opportunities to applications', () => {
    expect(migration).toContain('career_items_external_no_application')
    expect(migration).toContain("source_class <> 'GOVERNED_EXTERNAL' OR application_id IS NULL")
  })

  it('does not alter the shared applications table', () => {
    expect(migration).not.toMatch(/ALTER TABLE public\.applications/i)
    expect(migration).not.toMatch(/DROP TABLE public\.applications/i)
  })
})
