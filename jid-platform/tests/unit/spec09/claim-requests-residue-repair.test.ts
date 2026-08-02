// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(__dirname, '../../..')

describe('Spec 09-D claim_requests residue repair', () => {
  const migration = readFileSync(
    join(
      root,
      'supabase/migrations/20260802090000_repair_claim_requests_residue_helpers.sql',
    ),
    'utf8',
  )
  const middleware = readFileSync(join(root, 'src/middleware.ts'), 'utf8')
  const uniPage = readFileSync(
    join(root, 'src/app/[locale]/(public)/universities/[slug]/profile/page.tsx'),
    'utf8',
  )

  it('retargets viewer helpers and assign_claim_to_self away from claim_requests', () => {
    expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.viewer_approved_company_id/)
    expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.viewer_approved_university_id/)
    expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.assign_claim_to_self/)
    expect(migration).toMatch(/FROM public\.verification_requests/)
    expect(migration).toMatch(/FROM public\.business_profiles/)
    expect(migration).toMatch(/FROM public\.university_profiles/)
    expect(migration).not.toMatch(/FROM public\.claim_requests/)
    expect(migration).not.toMatch(/claim_requests%ROWTYPE/)
  })

  it('Staff/Sys wrong-role deny is a visible login redirect', () => {
    expect(middleware).toMatch(/function privilegedDenyResponse/)
    expect(middleware).toMatch(
      /handleStaffPortal[\s\S]*privilegedDenyResponse\(request, pathname\)/,
    )
    expect(middleware).toMatch(
      /handleSuperAdminPortal[\s\S]*privilegedDenyResponse\(request, pathname\)/,
    )
  })

  it('university public Profile page is force-dynamic (DEF-09B-004)', () => {
    expect(uniPage).toMatch(/export const dynamic = 'force-dynamic'/)
  })
})
