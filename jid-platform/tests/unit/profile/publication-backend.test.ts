/**
 * Spec 07-B — Publication RPC / RLS / action structural and contract tests.
 * Source-tree assertions (no live Supabase). Live matrix covered by
 * tests/rls/profile-publication.rls.test.ts when disposable env is present.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { mapPublicationError } from '@/lib/profile/publication'

const ROOT = join(process.cwd())
const SRC = join(ROOT, 'src')
const MIGRATIONS = join(ROOT, 'supabase', 'migrations')
const MESSAGES = join(ROOT, 'messages')

const FORBIDDEN_PUBLIC_COLUMNS = ['owner_user_id', 'verified_badge'] as const

function readSrc(relativePath: string): string {
  return readFileSync(join(SRC, relativePath), 'utf-8')
}

function readMigration(name: string): string {
  return readFileSync(join(MIGRATIONS, name), 'utf-8')
}

function readMessages(locale: 'en' | 'ar'): Record<string, unknown> {
  return JSON.parse(readFileSync(join(MESSAGES, `${locale}.json`), 'utf-8')) as Record<
    string,
    unknown
  >
}

const MIGRATION = '20260730190003_profile_publication_rpcs.sql'

describe('Spec 07-B — publication migration contract', () => {
  const sql = readMigration(MIGRATION)
  const migrations = readdirSync(MIGRATIONS).filter((name) => name.endsWith('.sql')).sort()

  it('is the single next migration after 20260730190002', () => {
    expect(migrations).toContain(MIGRATION)
    const idx = migrations.indexOf(MIGRATION)
    expect(migrations[idx - 1]).toBe('20260730190002_notify_claim_decision_outcome_urls.sql')
    expect(migrations.filter((name) => name.startsWith('20260730190003'))).toEqual([MIGRATION])
  })

  it('defines all four owner publication RPCs as SECURITY DEFINER with safe search_path', () => {
    for (const name of [
      'publish_business_profile',
      'unpublish_business_profile',
      'publish_university_profile',
      'unpublish_university_profile',
    ]) {
      expect(sql).toMatch(new RegExp(`CREATE OR REPLACE FUNCTION public\\.${name}\\(p_profile_id uuid\\)`))
      const slice = sql.slice(sql.indexOf(`CREATE OR REPLACE FUNCTION public.${name}`))
      const body = slice.slice(0, slice.indexOf('$$;') + 3)
      expect(body).toMatch(/SECURITY DEFINER/)
      expect(body).toMatch(/SET search_path = public, pg_temp/)
      expect(body).toMatch(/auth\.uid\(\)/)
      expect(body).toMatch(/owner_user_id/)
      expect(body).not.toMatch(/GRANT EXECUTE[\s\S]*TO anon/)
    }
  })

  it('grants EXECUTE only to authenticated and revokes PUBLIC/anon', () => {
    for (const name of [
      'publish_business_profile',
      'unpublish_business_profile',
      'publish_university_profile',
      'unpublish_university_profile',
    ]) {
      expect(sql).toMatch(
        new RegExp(
          `REVOKE ALL ON FUNCTION public\\.${name}\\(uuid\\) FROM PUBLIC, anon;\\s*GRANT EXECUTE ON FUNCTION public\\.${name}\\(uuid\\) TO authenticated;`,
        ),
      )
    }
  })

  it('validates only display_name_ar and about_ar and reports missing fields', () => {
    expect(sql).toMatch(/missing_required_fields:%/)
    expect(sql).toMatch(/array_append\(v_missing, 'display_name_ar'\)/)
    expect(sql).toMatch(/array_append\(v_missing, 'about_ar'\)/)
    expect(sql).not.toMatch(/array_append\(v_missing, 'display_name_en'\)/)
    expect(sql).not.toMatch(/array_append\(v_missing, 'tagline/)
    expect(sql).not.toMatch(/completeness/)
  })

  it('audits publish/unpublish and preserves suspension precedence', () => {
    expect(sql).toMatch(/'profile\.published'/)
    expect(sql).toMatch(/'profile\.unpublished'/)
    expect(sql).toMatch(/RAISE EXCEPTION 'profile_suspended'/)
    expect(sql).toMatch(/PERFORM public\._write_audit_log/)
    expect(sql).not.toMatch(/CREATE OR REPLACE FUNCTION public\.suspend_profile/)
    expect(sql).not.toMatch(/CREATE OR REPLACE FUNCTION public\.reinstate_profile/)
    expect(sql).not.toMatch(/CREATE OR REPLACE FUNCTION public\.create_business_profile/)
    expect(sql).not.toMatch(/CREATE OR REPLACE FUNCTION public\.create_university_profile/)
    expect(sql).not.toMatch(/CREATE OR REPLACE FUNCTION public\.approve_verification_request/)
  })

  it('uses narrow GUC escape so owners cannot write status outside publication RPCs', () => {
    expect(sql).toMatch(/set_config\('jid\.profile_publication_rpc', 'on', true\)/)
    expect(sql).toMatch(/current_setting\('jid\.profile_publication_rpc', true\) = 'on'/)
    expect(sql).toMatch(/OLD\.status = 'draft' AND NEW\.status = 'published'/)
    expect(sql).toMatch(/OLD\.status = 'published' AND NEW\.status = 'draft'/)
    expect(sql).toMatch(/RAISE EXCEPTION 'profile_moderation_fields_require_staff'/)
  })

  it('does not mutate Directory or Verification tables', () => {
    expect(sql).not.toMatch(/UPDATE public\.companies/)
    expect(sql).not.toMatch(/UPDATE public\.verification_requests/)
    expect(sql).not.toMatch(/INSERT INTO public\.companies/)
  })
})

describe('Spec 07-B — application wiring', () => {
  it('exposes typed wrappers and server actions without client owner_user_id', () => {
    const wrappers = readSrc('lib/profile/publication.ts')
    const actions = readSrc('lib/profile/publication-actions.ts')
    expect(wrappers).toMatch(/publish_business_profile/)
    expect(wrappers).toMatch(/unpublish_business_profile/)
    expect(wrappers).toMatch(/publish_university_profile/)
    expect(wrappers).toMatch(/unpublish_university_profile/)
    expect(actions).toMatch(/'use server'/)
    expect(actions).toMatch(/publishOwnedProfileAction/)
    expect(actions).toMatch(/unpublishOwnedProfileAction/)
    expect(actions).toMatch(/getCurrentViewer/)
    expect(actions).not.toMatch(/owner_user_id/)
    expect(actions).not.toMatch(/service_role|createServiceRole/)
    expect(wrappers).not.toMatch(/createServiceRole/)
  })

  it('public query foundation selects safe columns only and never owner identity', () => {
    const query = readSrc('lib/queries/published-profile.ts')
    expect(query).toMatch(/fetchPublishedUniversityProfileBySlug/)
    expect(query).toMatch(/lookupPublishedProfileLinkByDirectoryId/)
    expect(query).toMatch(/\/companies\/\$\{slug\}\/profile/)
    expect(query).toMatch(/\/universities\/\$\{slug\}\/profile/)
    expect(query).toMatch(/ambiguous_published_profiles/)
    expect(query).toMatch(/BUSINESS_PUBLIC_SELECT =/)
    expect(query).toMatch(/UNIVERSITY_PUBLIC_SELECT =/)
    const businessSelect = query.match(/BUSINESS_PUBLIC_SELECT =\s*\n?\s*'([^']+)'/)?.[1] ?? ''
    const universitySelect = query.match(/UNIVERSITY_PUBLIC_SELECT =\s*\n?\s*'([^']+)'/)?.[1] ?? ''
    expect(businessSelect.length).toBeGreaterThan(0)
    expect(universitySelect.length).toBeGreaterThan(0)
    for (const col of FORBIDDEN_PUBLIC_COLUMNS) {
      expect(businessSelect).not.toMatch(new RegExp(`\\b${col}\\b`))
      expect(universitySelect).not.toMatch(new RegExp(`\\b${col}\\b`))
    }
  })

  it('maps missing-field and suspension errors honestly', () => {
    expect(mapPublicationError('missing_required_fields:display_name_ar')).toBe(
      'missing_display_name_ar',
    )
    expect(mapPublicationError('missing_required_fields:about_ar')).toBe('missing_about_ar')
    expect(mapPublicationError('missing_required_fields:display_name_ar,about_ar')).toBe(
      'missing_display_name_ar_and_about_ar',
    )
    expect(mapPublicationError('profile_suspended')).toBe('profile_suspended')
    expect(mapPublicationError('profile_already_published')).toBe('profile_already_published')
  })

  it('adds AR/EN publication error keys with matching shapes', () => {
    const en = readMessages('en')
    const ar = readMessages('ar')
    const enErrors = (
      (en.organizationProfile as Record<string, unknown>).publication as {
        errors: Record<string, string>
      }
    ).errors
    const arErrors = (
      (ar.organizationProfile as Record<string, unknown>).publication as {
        errors: Record<string, string>
      }
    ).errors
    expect(Object.keys(enErrors).sort()).toEqual(Object.keys(arErrors).sort())
    expect(enErrors.missing_display_name_ar).toMatch(/Arabic display name/i)
    expect(arErrors.missing_about_ar).toMatch(/النبذة/)
    expect(JSON.stringify(en)).not.toMatch(/completeness percentage|completeness score/i)
    expect(JSON.stringify(en.organizationProfile)).not.toMatch(/\bClaim\b/)
    expect(JSON.stringify(ar.organizationProfile)).not.toMatch(/مطالبة/)
  })

  it('does not redesign staff suspension or Spec 02 decision RPCs in app code', () => {
    const moderation = readSrc('lib/staff/moderation.ts')
    expect(moderation).toMatch(/suspend_profile/)
    expect(moderation).toMatch(/reinstate_profile/)
    const pub = readSrc('lib/profile/publication.ts')
    expect(pub).not.toMatch(/suspend_profile|reinstate_profile/)
  })
})

describe('Spec 07-B — public SELECT policies remain published-only (110)', () => {
  const policies = readMigration('110_profile_ownership_policies.sql')

  it('retains anon/authenticated published-only SELECT for both tables', () => {
    expect(policies).toMatch(
      /CREATE POLICY profile_public_read_published[\s\S]*TO anon, authenticated[\s\S]*USING \(status = 'published'\)/,
    )
    expect(policies).toMatch(
      /CREATE POLICY university_profile_public_read_published[\s\S]*TO anon, authenticated[\s\S]*USING \(status = 'published'\)/,
    )
    expect(policies).toMatch(/CREATE POLICY profile_owner_read_own/)
    expect(policies).toMatch(/CREATE POLICY university_profile_owner_read_own/)
  })

  it('Session B migration does not weaken public SELECT', () => {
    const sql = readMigration(MIGRATION)
    expect(sql).not.toMatch(/DROP POLICY IF EXISTS profile_public_read_published/)
    expect(sql).not.toMatch(/DROP POLICY IF EXISTS university_profile_public_read_published/)
    expect(sql).not.toMatch(/CREATE POLICY profile_public_read/)
  })
})
