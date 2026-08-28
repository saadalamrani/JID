import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260828120000_wave2_create_application_cv_snapshot.sql',
  ),
  'utf8',
)

describe('create_application_cv_snapshot contract', () => {
  it('is a single atomic SECURITY DEFINER operation', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.create_application_cv_snapshot')
    expect(migration).toContain('SECURITY DEFINER')
    expect(migration).toContain("'APPLICATION'::public.cv_snapshot_purpose_enum")
    expect(migration).toContain('create_cv_projection_snapshot')
    expect(migration).toContain('SET cv_snapshot_id = v_snapshot_id')
    expect(migration).toContain('AND cv_snapshot_id IS NULL')
  })

  it('fail-closes instead of silently replacing an existing snapshot', () => {
    expect(migration).toContain('already has a cv snapshot')
    expect(migration).toContain('application snapshot link failed')
    expect(migration).toContain("USING ERRCODE = 'unique_violation'")
  })

  it('proves applicant ownership and matching CV subject', () => {
    expect(migration).toContain('applicant_id IS DISTINCT FROM v_uid')
    expect(migration).toContain('v_cv_owner IS DISTINCT FROM v_uid')
  })

  it('preserves C5 APPLICATION recipient rules and does not grant by role', () => {
    expect(migration).toContain("recipient_type <> 'BUSINESS'")
    expect(migration).toContain('does not match the application company')
    expect(migration).not.toMatch(/FROM\s+public\.staff/i)
    expect(migration).not.toMatch(/user_roles/)
  })

  it('rolls back the snapshot when the application pointer cannot be set', () => {
    const snapshotCall = migration.indexOf('v_snapshot_id := public.create_cv_projection_snapshot')
    const linkUpdate = migration.indexOf('SET cv_snapshot_id = v_snapshot_id')
    const raiseAfter = migration.indexOf('application snapshot link failed')
    expect(snapshotCall).toBeGreaterThan(0)
    expect(linkUpdate).toBeGreaterThan(snapshotCall)
    expect(raiseAfter).toBeGreaterThan(linkUpdate)
  })
})
