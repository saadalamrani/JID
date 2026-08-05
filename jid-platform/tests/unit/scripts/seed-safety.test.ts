import { describe, expect, it } from 'vitest'
import {
  ALLOWED_NONPROD_PROJECT_REF,
  EXPECTED_SHAREABLE_SITE_URL,
  FORBIDDEN_PRODUCTION_PROJECT_REF,
  SEED_PASSWORD,
  SHAREABLE_PREMIUM_MATRIX,
  SHAREABLE_SEED_MARKER,
  SHAREABLE_TEST_ACCOUNTS,
  assertAllowedProjectRefs,
  assertExecuteConfirmation,
  assertExpectedShareableSiteUrl,
  assertPrivilegedDbCredential,
  assertSeedEnvAllowed,
  extractProjectRefFromDbUrl,
  extractProjectRefFromSupabaseUrl,
  formatArabicAccessTable,
  looksLikeProductionTarget,
} from '../../../scripts/lib/seed-safety'

describe('seed-safety guards', () => {
  it('refuses production SEED_ENV / APP_ENV', () => {
    expect(
      looksLikeProductionTarget({
        seedEnv: 'production',
        supabaseUrl: `https://${ALLOWED_NONPROD_PROJECT_REF}.supabase.co`,
      }),
    ).toMatch(/production/i)

    expect(
      looksLikeProductionTarget({
        appEnv: 'production',
        dbUrl: `postgresql://postgres.${ALLOWED_NONPROD_PROJECT_REF}:x@aws-0-x.pooler.supabase.com:6543/postgres`,
      }),
    ).toMatch(/production/i)
  })

  it('refuses production project ref', () => {
    expect(
      looksLikeProductionTarget({
        seedEnv: 'nonprod',
        supabaseUrl: `https://${FORBIDDEN_PRODUCTION_PROJECT_REF}.supabase.co`,
      }),
    ).toMatch(/production/)
  })

  it('refuses wrong project-ref allowlist', () => {
    expect(() =>
      assertAllowedProjectRefs({
        supabaseUrl: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co',
        dbUrl:
          'postgresql://postgres.aaaaaaaaaaaaaaaaaaaa:x@aws-0-x.pooler.supabase.com:6543/postgres',
      }),
    ).toThrow(/exactly hmjuijmaefajdjrjdsxu/)
  })

  it('accepts exact nonprod project ref on URL + pooler DB', () => {
    expect(() =>
      assertAllowedProjectRefs({
        supabaseUrl: `https://${ALLOWED_NONPROD_PROJECT_REF}.supabase.co`,
        dbUrl: `postgresql://postgres.${ALLOWED_NONPROD_PROJECT_REF}:x@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
      }),
    ).not.toThrow()
  })

  it('refuses wrong site URL', () => {
    expect(() => assertExpectedShareableSiteUrl('https://example.com')).toThrow(
      /jid-dev\.vercel\.app/,
    )
  })

  it('accepts exact shareable site URL', () => {
    expect(assertExpectedShareableSiteUrl(EXPECTED_SHAREABLE_SITE_URL)).toBe(
      EXPECTED_SHAREABLE_SITE_URL,
    )
  })

  it('refuses missing execute confirmation', () => {
    expect(() => assertExecuteConfirmation({ execute: true, confirmNonProd: false })).toThrow(
      /--i-confirm-non-production/,
    )
  })

  it('refuses missing privileged DB credential', () => {
    expect(() => assertPrivilegedDbCredential(undefined)).toThrow(/SEED_DATABASE_URL/)
    expect(() => assertPrivilegedDbCredential('')).toThrow(/SEED_DATABASE_URL/)
  })

  it('allows only non-production SEED_ENV values', () => {
    expect(assertSeedEnvAllowed('nonprod')).toBe('nonprod')
    expect(() => assertSeedEnvAllowed('production')).toThrow(/SEED_ENV/)
  })

  it('extracts project refs from supabase and pooler URLs', () => {
    expect(
      extractProjectRefFromSupabaseUrl(`https://${ALLOWED_NONPROD_PROJECT_REF}.supabase.co`),
    ).toBe(ALLOWED_NONPROD_PROJECT_REF)
    expect(
      extractProjectRefFromDbUrl(
        `postgresql://postgres.${ALLOWED_NONPROD_PROJECT_REF}:secret@aws-0-x.pooler.supabase.com:6543/postgres`,
      ),
    ).toBe(ALLOWED_NONPROD_PROJECT_REF)
  })
})

describe('shareable account architecture', () => {
  it('uses deterministic password and V2 marker', () => {
    expect(SEED_PASSWORD).toBe('JidSeed123!')
    expect(SHAREABLE_SEED_MARKER).toBe('JID_SHAREABLE_TEST_SEED_V2')
  })

  it('keeps mentor as Individual (not a fourth public actor)', () => {
    const mentor = SHAREABLE_TEST_ACCOUNTS.find((a) => a.email === 'mentor-approved@jidseed.test')
    expect(mentor?.role).toContain('individual')
    expect(mentor?.role.toLowerCase()).not.toBe('mentor')
  })

  it('does not create public actor roles for staff / super_admin', () => {
    const staff = SHAREABLE_TEST_ACCOUNTS.find((a) => a.email === 'staff@jidseed.test')
    const admin = SHAREABLE_TEST_ACCOUNTS.find((a) => a.email === 'admin@jidseed.test')
    expect(staff?.role).toBe('staff')
    expect(admin?.role).toBe('super_admin')
    expect(staff?.shareWithFriends).toBe(false)
    expect(admin?.shareWithFriends).toBe(false)
  })

  it('assigns Plus to complete/new/mentor and employer_premium to business verified', () => {
    const plusEmails = [
      'individual-complete@jidseed.test',
      'individual-new@jidseed.test',
      'mentor-approved@jidseed.test',
    ]
    for (const email of plusEmails) {
      const row = SHAREABLE_PREMIUM_MATRIX.find((r) => r.email === email)
      expect(row?.planKey).toBe('jid_plus')
      expect(row?.available).toEqual(expect.arrayContaining(['cv_pro_formats', 'lammah_feed']))
    }

    const business = SHAREABLE_PREMIUM_MATRIX.find(
      (r) => r.email === 'business-verified@jidseed.test',
    )
    expect(business?.planKey).toBe('employer_premium')
    expect(business?.available).toEqual(
      expect.arrayContaining(['smart_communication', 'ssis', 'priority_visibility']),
    )
  })

  it('reports university premium as not implemented', () => {
    const uni = SHAREABLE_PREMIUM_MATRIX.find((r) => r.email === 'university-verified@jidseed.test')
    expect(uni?.planKey).toBeNull()
    expect(uni?.unavailable[0]?.reason).toMatch(/not implemented/i)
  })

  it('keeps pending business premium features unavailable due to Verification', () => {
    const pending = SHAREABLE_PREMIUM_MATRIX.find(
      (r) => r.email === 'business-pending@jidseed.test',
    )
    expect(pending?.available).toHaveLength(0)
    expect(pending?.unavailable.every((u) => /Verification is pending/i.test(u.reason))).toBe(true)
  })

  it('formats Arabic access table with premium column and no Claim wording', () => {
    const table = formatArabicAccessTable(EXPECTED_SHAREABLE_SITE_URL)
    expect(table).toContain('الوصول المميز')
    expect(table).toContain('individual-complete@jidseed.test')
    expect(table.toLowerCase()).not.toContain('claim')
    expect(table).not.toContain('استلام')
  })

  it('does not invent fake invoices or production DB targets in matrix', () => {
    const joined = JSON.stringify(SHAREABLE_PREMIUM_MATRIX)
    expect(joined.toLowerCase()).not.toContain('stripe')
    expect(joined).not.toContain(FORBIDDEN_PRODUCTION_PROJECT_REF)
  })
})
