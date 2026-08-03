import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  buildGleifPageUrl,
  isValidLei,
  normalizeLegalName,
  parseGleifRecord,
} from '../../../supabase/functions/_shared/catalog-gleif'

const root = process.cwd()
const migration = readFileSync(
  join(root, 'supabase/migrations/20260803120000_catalog_gleif_review_states.sql'),
  'utf8',
)
const connector = readFileSync(join(root, 'supabase/functions/catalog-gleif-sync/index.ts'), 'utf8')
const provisioner = readFileSync(
  join(root, 'scripts/catalog/provision-catalog-gleif-worker.sql'),
  'utf8',
)

function fixture(overrides: Record<string, unknown> = {}) {
  return {
    type: 'lei-records',
    id: '9845003OC587591DQ586',
    attributes: {
      lei: '9845003OC587591DQ586',
      entity: {
        legalName: { name: 'شركة برو كير فاسيليتيز', language: 'ar' },
        otherNames: [{ name: 'Pro Care Facilities Company', language: 'en' }],
        transliteratedOtherNames: [],
        legalAddress: {
          language: 'ar',
          addressLines: ['طريق الملك فهد'],
          city: 'Riyadh',
          region: 'SA-01',
          country: 'SA',
          postalCode: '12345',
        },
        registeredAt: { id: 'RA000513', other: null },
        registeredAs: '1010000000',
        jurisdiction: 'SA',
        legalForm: { id: '8888', other: 'شركة شخص واحد' },
        creationDate: '2020-01-02',
        status: 'ACTIVE',
        ...overrides,
      },
      registration: { status: 'ISSUED' },
    },
    relationships: {},
  }
}

describe('GLEIF final shipping connector', () => {
  it('validates LEI check digits and deterministic name normalization', () => {
    expect(isValidLei('9845003OC587591DQ586')).toBe(true)
    expect(isValidLei('9845003OC587591DQ587')).toBe(false)
    expect(normalizeLegalName('  ACME—Holdings, LLC  ')).toBe('acme holdings llc')
  })

  it('parses the live-contract shape without inventing domains or an Arabic publication fact', () => {
    const parsed = parseGleifRecord(fixture(), '2026-08-03T10:00:00.000Z')
    expect(parsed.lei).toBe('9845003OC587591DQ586')
    expect(parsed.city).toBe('Riyadh')
    expect(parsed.registrationAuthority).toBe('RA000513')
    expect(parsed.intakeFacts).not.toHaveProperty('official_domains')
    expect(parsed.intakeFacts).not.toHaveProperty('name_ar')
    expect(parsed.extendedFacts).toHaveProperty('address_country')
    expect(parsed.extendedFacts).toHaveProperty('registration_identifier')
  })

  it('enforces Saudi scope and status handling', () => {
    const outside = fixture({
      legalAddress: { city: 'London', country: 'GB' },
    })
    expect(() => parseGleifRecord(outside)).toThrow('outside_saudi_scope')
    const lapsed = fixture()
    ;(lapsed.attributes.registration as { status: string }).status = 'LAPSED'
    expect(parseGleifRecord(lapsed).reviewFlags).toContain('lapsed_registration')
    const inactive = parseGleifRecord(fixture({ status: 'INACTIVE' }))
    expect(inactive.quarantined).toBe(true)
    expect(inactive.reviewFlags).toContain('inactive_entity')
  })

  it('uses the exact Saudi API filter and bounded page size', () => {
    const url = buildGleifPageUrl('https://api.gleif.org/api/v1/lei-records', 2, 999)
    expect(url.searchParams.get('filter[entity.legalAddress.country]')).toBe('SA')
    expect(url.searchParams.get('page[number]')).toBe('2')
    expect(url.searchParams.get('page[size]')).toBe('200')
  })

  it('keeps the connector off service-role and client-exposed credentials', () => {
    expect(connector).not.toContain('SERVICE_ROLE')
    expect(connector).not.toContain('service_role')
    expect(connector).not.toContain('NEXT_PUBLIC_')
    expect(connector).toContain('CATALOG_GLEIF_DATABASE_URL')
    expect(connector).toContain('CATALOG_GLEIF_INVOCATION_SECRET')
  })

  it('provisions the LOGIN role only out of band with least privilege', () => {
    expect(migration).not.toMatch(/CREATE ROLE\s+catalog_worker_gleif/i)
    expect(provisioner).toMatch(
      /CREATE ROLE catalog_worker_gleif LOGIN INHERIT NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION/,
    )
    expect(provisioner).toContain('GRANT catalog_worker TO catalog_worker_gleif')
    expect(provisioner).toContain("target_project_ref' = 'hmjuijmaefajdjrjdsxu'")
    expect(provisioner).toContain('Refusing provisioning')
  })

  it('preserves human-only publication and exact staff authorization', () => {
    expect(migration).toContain("v_role NOT IN ('staff','super_admin')")
    expect(migration).toContain("p_action='approve_pending_domain'")
    expect(migration).toContain("p_action='validate_domain'")
    expect(migration).not.toMatch(/CREATE TRIGGER[\s\S]{0,200}publish_directory_candidate/i)
  })

  it('adds no authenticated SECURITY DEFINER exception beyond the accepted publication RPC', () => {
    for (const rpc of [
      'claim_directory_candidate',
      'review_directory_candidate',
      'configure_catalog_gleif',
      'redrive_catalog_dead_letter',
      'execute_catalog_retention',
    ]) {
      expect(migration).toMatch(
        new RegExp(`CREATE FUNCTION public\\.${rpc}\\([\\s\\S]*?SECURITY INVOKER`),
      )
    }
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.catalog_begin_gleif_run[\s\S]*FROM PUBLIC,anon,authenticated,service_role/,
    )
  })
})
