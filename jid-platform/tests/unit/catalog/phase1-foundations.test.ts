import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const migrationName = '20260802205903_catalog_phase1_foundations.sql'
const migration = readFileSync(join(root, 'supabase', 'migrations', migrationName), 'utf8')
const generatedTypes = readFileSync(join(root, 'src', 'lib', 'supabase', 'types.ts'), 'utf8')

const adjacentTables = [
  'directory_sources',
  'directory_sync_runs',
  'directory_raw_evidence',
  'directory_import_candidates',
  'directory_candidate_facts',
  'directory_review_queue',
  'directory_dead_letters',
] as const

describe('Catalog Phase 1 foundations migration', () => {
  it('is ordered after the approved canonical migration chain', () => {
    const migrations = readdirSync(join(root, 'supabase', 'migrations'))
      .filter((name) => name.endsWith('.sql'))
      .sort()
    const index = migrations.indexOf(migrationName)

    expect(index).toBeGreaterThan(0)
    expect(migrations[index - 1]).toBe('20260802120000_university_dashboard_view_owner_scope.sql')
  })

  it('creates exactly the approved seven adjacent tables and no directory_records', () => {
    const created = Array.from(migration.matchAll(/CREATE TABLE public\.(directory_[a-z_]+)/g)).map(
      ([, table]) => table,
    )

    expect(created).toEqual(adjacentTables)
    expect(migration).not.toMatch(/CREATE TABLE public\.directory_records/)
  })

  it('creates capability and function-owner roles without login or bypass powers', () => {
    expect(migration).toMatch(
      /CREATE ROLE catalog_worker NOLOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB\s+NOCREATEROLE NOREPLICATION INHERIT/,
    )
    expect(migration).toMatch(
      /CREATE ROLE catalog_function_owner NOLOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB\s+NOCREATEROLE NOREPLICATION NOINHERIT/,
    )
    expect(migration).not.toMatch(/ALTER SCHEMA public OWNER TO catalog_function_owner/)
  })

  it('uses the bounded direct CREATE handshake and immediately revokes it', () => {
    const grant = migration.indexOf('GRANT CREATE ON SCHEMA public TO catalog_function_owner;')
    const firstTransfer = migration.indexOf('OWNER TO catalog_function_owner;', grant)
    const lastTransfer = migration.lastIndexOf('OWNER TO catalog_function_owner;')
    const revoke = migration.indexOf('REVOKE CREATE ON SCHEMA public FROM catalog_function_owner;')

    expect(grant).toBeGreaterThan(-1)
    expect(firstTransfer).toBeGreaterThan(grant)
    expect(lastTransfer).toBeGreaterThanOrEqual(firstTransfer)
    expect(revoke).toBeGreaterThan(lastTransfer)
    expect(migration.slice(revoke)).not.toMatch(/GRANT CREATE ON SCHEMA public/)
  })

  it('exposes only intake to catalog_worker and publication to authenticated', () => {
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.ingest_directory_candidate[\s\S]*FROM PUBLIC, anon, authenticated, service_role/,
    )
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.ingest_directory_candidate\([\s\S]*\) TO catalog_worker;/,
    )
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.publish_directory_candidate\(uuid\)[\s\S]*FROM PUBLIC, anon, service_role, catalog_worker;/,
    )
    expect(migration).toContain(
      'GRANT EXECUTE ON FUNCTION public.publish_directory_candidate(uuid) TO authenticated;',
    )
  })

  it('fixes search paths and independently authorizes only Staff and Super Admin', () => {
    const intake = migration.slice(
      migration.indexOf('CREATE FUNCTION public.ingest_directory_candidate'),
      migration.indexOf('-- Authenticated Staff/Super Admin human-publication boundary'),
    )
    const publication = migration.slice(
      migration.indexOf('CREATE FUNCTION public.publish_directory_candidate'),
      migration.indexOf('REVOKE ALL ON FUNCTION public._catalog_reject_intake'),
    )

    expect(intake).toContain('SECURITY DEFINER')
    expect(intake).toContain('SET search_path = pg_catalog, public')
    expect(intake).toContain('pg_advisory_xact_lock')
    expect(publication).toContain('SECURITY DEFINER')
    expect(publication).toContain('SET search_path = pg_catalog, public')
    expect(publication).toContain("v_actor_role NOT IN ('staff', 'super_admin')")
    expect(publication).not.toMatch(/'admin'\s*[,)]/)
  })

  it('enables and forces RLS on every adjacent table with no client writes', () => {
    for (const table of adjacentTables) {
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`)
      expect(migration).toContain(`ALTER TABLE public.${table} FORCE ROW LEVEL SECURITY;`)
    }
    expect(migration).toContain("IN ('staff', 'super_admin')")
    expect(migration).toMatch(/REVOKE ALL ON TABLE[\s\S]*FROM PUBLIC, anon, authenticated, service_role, catalog_worker/)
  })

  it('keeps the new ingestion flag false without changing Catalog browse behavior', () => {
    expect(migration).toContain("'catalog.phase1_ingestion',")
    expect(migration).toMatch(/'catalog\.phase1_ingestion',[\s\S]*?false,/)
    expect(migration).toMatch(/ON CONFLICT \(key\) DO UPDATE SET\s+is_enabled = false/)
    expect(migration).not.toMatch(/WHERE key = 'catalog'|UPDATE public\.feature_flags[\s\S]*key = 'catalog'/)
  })

  it('keeps intake adjacent and prohibits Profile, Verification, ownership, and publication writes', () => {
    const intake = migration.slice(
      migration.indexOf('CREATE FUNCTION public.ingest_directory_candidate'),
      migration.indexOf('-- Authenticated Staff/Super Admin human-publication boundary'),
    )

    expect(intake).not.toMatch(/(?:INSERT INTO|UPDATE|DELETE FROM) public\.(?:companies|business_profiles|university_profiles|verification_requests|profiles)/)
    for (const field of [
      'claimed_by',
      'claim_requested_at',
      'is_verified',
      'entity_state',
      'sector_id',
      'region_id',
      'website_url',
      'subscription_tier',
    ]) {
      expect(intake).toContain(`'${field}'`)
    }
    expect(intake).not.toContain('service_role')
  })

  it('publishes through the exact allowlist and pins unowned/unverified values', () => {
    const publication = migration.slice(
      migration.indexOf('CREATE FUNCTION public.publish_directory_candidate'),
      migration.indexOf('REVOKE ALL ON FUNCTION public._catalog_reject_intake'),
    )

    expect(publication).toMatch(/INSERT INTO public\.companies \(\s+id, name, name_ar, domains, entity_type, city, founded_year,\s+slug, is_active, link_status, updated_at/)
    expect(publication).toMatch(/UPDATE public\.companies\s+SET\s+name = v_company_name,\s+name_ar = COALESCE\(v_name_ar, name_ar\),\s+domains = v_domains,\s+city = COALESCE\(v_city, city\),\s+founded_year = COALESCE\(v_founded_year, founded_year\),\s+updated_at = now\(\)/)
    expect(publication).toContain("v_target.entity_state <> 'unclaimed'")
    expect(publication).toContain('v_target.claimed_by IS NOT NULL')
    expect(publication).toContain('v_target.is_verified')
    expect(publication).not.toMatch(/(?:INSERT INTO|UPDATE|DELETE FROM) public\.(?:business_profiles|university_profiles|verification_requests)/)
  })

  it('rejects absent, empty, placeholder, local, and malformed official domains', () => {
    expect(migration).toContain("domain IN ('stub.local', 'localhost', 'example.com', 'placeholder.local')")
    expect(migration).toContain("domain LIKE '%.local'")
    expect(migration).toContain("'official_domain_invalid'")
    expect(migration).toContain('v_domains IS NULL OR cardinality(v_domains) = 0')
  })

  it('uses the immutable existing audit boundary and bounded retention metadata', () => {
    expect(migration).toContain('public._write_audit_log(')
    expect(migration).not.toMatch(/INSERT INTO public\.audit_logs/)
    expect(migration).toContain("retention_state IN ('active', 'superseded', 'quarantined', 'payload_deleted')")
    expect(migration).toContain("retrieved_at + interval '30 days'")
    expect(migration).toContain('retention_override_days BETWEEN 1 AND 180')
    expect(migration).toContain('retry_count BETWEEN 0 AND 3')
  })

  it('contains no connector, retrieval, external import, UI, or automatic publication implementation', () => {
    expect(migration).not.toMatch(/CREATE ROLE[\s\S]*?\bLOGIN\b/i)
    expect(migration).not.toMatch(/https?:\/\//)
    expect(migration).not.toMatch(/GLEIF|fetch\(|axios/i)
    expect(migration).not.toMatch(/GRANT[^;]+TO service_role/i)
    expect(migration).not.toMatch(/CREATE TRIGGER[\s\S]{0,200}publish_directory_candidate/i)
  })

  it('regenerates exact TypeScript contracts for all seven tables and both RPCs', () => {
    for (const table of adjacentTables) {
      expect(generatedTypes).toContain(`${table}: {`)
    }
    expect(generatedTypes).toContain('ingest_directory_candidate: {')
    expect(generatedTypes).toContain('publish_directory_candidate: {')
    expect(generatedTypes).not.toContain('directory_records: {')
  })
})
