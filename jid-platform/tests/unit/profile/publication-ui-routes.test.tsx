/**
 * Spec 07-D — Public Profile routes, Directory link, i18n, contract regression.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { CatalogCta } from '@/app/[locale]/(public)/catalog/_components/catalog-cta'
import { PublicUniversityProfileView } from '@/components/organization-profile/public-university-profile-view'
import type { PublicPublishedUniversityProfile } from '@/lib/queries/published-profile'

const ROOT = join(process.cwd())
const SRC = join(ROOT, 'src')
const MIGRATIONS = join(ROOT, 'supabase', 'migrations')
const MESSAGES = join(ROOT, 'messages')

function readSrc(relativePath: string): string {
  return readFileSync(join(SRC, relativePath), 'utf-8')
}

function readMessages(locale: 'en' | 'ar'): Record<string, unknown> {
  return JSON.parse(readFileSync(join(MESSAGES, `${locale}.json`), 'utf-8')) as Record<
    string,
    unknown
  >
}

function collectLeafPaths(value: unknown, prefix = ''): string[] {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : []
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    collectLeafPaths(child, prefix ? `${prefix}.${key}` : key),
  )
}

vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('Spec 07-D — public routes and Directory link wiring', () => {
  it('keeps Business public route published-only and not-found for hidden states', () => {
    const page = readSrc('app/[locale]/(public)/companies/[slug]/profile/page.tsx')
    expect(page).toMatch(/fetchPublishedBusinessProfileBySlug/)
    expect(page).toMatch(/notFound\(\)/)
    expect(page).not.toMatch(/owner_user_id/)
    expect(page).not.toMatch(/createServiceRole/)
  })

  it('adds University public route at /universities/[slug]/profile', () => {
    const page = readSrc('app/[locale]/(public)/universities/[slug]/profile/page.tsx')
    expect(page).toMatch(/fetchPublishedUniversityProfileBySlug/)
    expect(page).toMatch(/notFound\(\)/)
    expect(page).not.toMatch(/owner_user_id/)
    expect(page).not.toMatch(/verified_badge/)
    expect(page).not.toMatch(/suspend/)
  })

  it('Directory detail uses validated published-Profile lookup before linking', () => {
    const page = readSrc('app/[locale]/(public)/catalog/[slug]/page.tsx')
    const cta = readSrc('app/[locale]/(public)/catalog/_components/catalog-cta.tsx')
    expect(page).toMatch(/lookupPublishedProfileLinkByDirectoryId/)
    expect(page).toMatch(/publishedProfileHref/)
    expect(cta).toMatch(/publishedProfileHref/)
    expect(cta).toMatch(/\/universities\/\$\{slug\}\/profile/)
    expect(cta).toMatch(/\/companies\/\$\{slug\}\/profile/)
  })

  it('owner mounts remain OrganizationProfileShell and draft dashboard', () => {
    const shell = readSrc('components/organization-profile/organization-profile-shell.tsx')
    const dashboard = readSrc('components/organization-profile/organization-draft-dashboard.tsx')
    const boundary = readSrc('components/organization-profile/draft-publication-boundary.tsx')
    expect(shell).toMatch(/DraftPublicationBoundary/)
    expect(shell).toMatch(/profileId/)
    expect(dashboard).toMatch(/DraftPublicationBoundary/)
    expect(boundary).toMatch(/publishOwnedProfileAction/)
    expect(boundary).toMatch(/unpublishOwnedProfileAction/)
    expect(boundary).not.toMatch(/owner_user_id/)
  })
})

describe('Spec 07-D — CatalogCta published Profile href', () => {
  it('links Business published Profile to /companies/[slug]/profile', () => {
    render(
      <CatalogCta
        slug="biz-a"
        careerPortalUrl={null}
        linkStatus="pending"
        hasPublishedProfile
        entityType="business"
      />,
    )
    expect(screen.getByRole('link', { name: 'jidProfileAria' })).toHaveAttribute(
      'href',
      '/companies/biz-a/profile',
    )
  })

  it('links University published Profile to /universities/[slug]/profile', () => {
    render(
      <CatalogCta
        slug="uni-a"
        careerPortalUrl={null}
        linkStatus="pending"
        hasPublishedProfile
        entityType="university"
      />,
    )
    expect(screen.getByRole('link', { name: 'jidProfileAria' })).toHaveAttribute(
      'href',
      '/universities/uni-a/profile',
    )
  })

  it('renders no Profile link for draft/absent/ambiguous (hasPublishedProfile false)', () => {
    render(
      <CatalogCta
        slug="biz-a"
        careerPortalUrl={null}
        linkStatus="pending"
        hasPublishedProfile={false}
        entityType="business"
      />,
    )
    expect(screen.queryByRole('link', { name: 'jidProfileAria' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('linkPending')).toBeInTheDocument()
  })

  it('uses server-provided href when present and does not invent another', () => {
    render(
      <CatalogCta
        slug="ignored"
        careerPortalUrl={null}
        linkStatus="pending"
        hasPublishedProfile
        publishedProfileHref="/universities/exact-uni/profile"
        entityType="business"
      />,
    )
    expect(screen.getByRole('link', { name: 'jidProfileAria' })).toHaveAttribute(
      'href',
      '/universities/exact-uni/profile',
    )
  })
})

describe('Spec 07-D — public University Profile privacy', () => {
  const profile: PublicPublishedUniversityProfile = {
    id: '22222222-2222-4222-8222-222222222222',
    directory_id: '33333333-3333-4333-8333-333333333333',
    display_name_ar: 'جامعة اصطناعية',
    display_name_en: 'Synthetic University',
    about_ar: 'نبذة',
    about_en: 'About',
    cover_image_url: null,
    verified_domains: ['example.edu.sa'],
    published_at: '2026-07-30T12:00:00Z',
    profile_type: 'university',
    established_year: 2020,
  }

  it('renders permitted fields and omits owner/moderation internals', () => {
    const { container } = render(
      <PublicUniversityProfileView
        profile={profile}
        directory={{ id: profile.directory_id, slug: 'synth-uni', logo_url: null }}
      />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('جامعة اصطناعية')
    expect(screen.getByText('2020')).toBeInTheDocument()
    expect(screen.getByText('example.edu.sa')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/owner_user_id|verified_badge|suspended|moderation/i)
    expect(container.textContent).not.toMatch(/\b0\b/)
  })

  it('omits established year when absent and does not coerce to 0', () => {
    const { container } = render(
      <PublicUniversityProfileView
        profile={{ ...profile, established_year: null, verified_domains: null }}
        directory={{ id: profile.directory_id, slug: 'synth-uni', logo_url: null }}
      />,
    )
    expect(screen.queryByText('established')).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/\b0\b/)
  })
})

describe('Spec 07-D — AR/EN publication UI parity', () => {
  it('keeps organizationProfile.publication keys matched across locales', () => {
    const en = readMessages('en')
    const ar = readMessages('ar')
    const enPub = (en.organizationProfile as Record<string, unknown>).publication
    const arPub = (ar.organizationProfile as Record<string, unknown>).publication
    expect(collectLeafPaths(enPub).sort()).toEqual(collectLeafPaths(arPub).sort())

    const enUni = (en.organizationProfile as Record<string, unknown>).universityPublic
    const arUni = (ar.organizationProfile as Record<string, unknown>).universityPublic
    expect(collectLeafPaths(enUni).sort()).toEqual(collectLeafPaths(arUni).sort())

    const enCta = (en.catalogPage as Record<string, unknown>).cta as Record<string, string>
    const arCta = (ar.catalogPage as Record<string, unknown>).cta as Record<string, string>
    expect(Object.keys(enCta).sort()).toEqual(Object.keys(arCta).sort())
    expect(enCta.jidProfileAria).toBeTruthy()
    expect(arCta.jidProfileAria).toBeTruthy()
  })

  it('avoids Claim wording and completeness metrics in publication copy', () => {
    const en = JSON.stringify(readMessages('en').organizationProfile)
    const ar = JSON.stringify(readMessages('ar').organizationProfile)
    expect(en).not.toMatch(/\bClaim\b/)
    expect(ar).not.toMatch(/مطالبة/)
    expect(en.toLowerCase()).not.toMatch(/completeness percentage|completeness score|progress ring/)
  })
})

describe('Spec 07-D — backend contract regression (no migration / RPC edits)', () => {
  it('does not add publication RPC migrations after Session 07-C (post-Spec09 allowlist)', () => {
    const migrations = readdirSync(MIGRATIONS)
      .filter((name) => name.endsWith('.sql'))
      .sort()
    const later = migrations.filter((name) => name > '20260730190003_profile_publication_rpcs.sql')
    // Later nonpublication contracts may ship, but none may replace an
    // established publication RPC.
    const allowed = [
      '20260802090000_repair_claim_requests_residue_helpers.sql',
      '20260802120000_university_dashboard_view_owner_scope.sql',
      '20260802205903_catalog_phase1_foundations.sql',
      '20260803120000_catalog_gleif_review_states.sql',
      '20260803120100_lammah_phase1_foundations.sql',
      '20260803120200_lammah_phase1_workflows.sql',
      '20260805120000_remove_deferred_search_product_artifacts.sql',
      '20260805190100_catalog_review_auth_wrappers.sql',
      '20260809065512_security_privacy_gate_a_expand.sql',
      '20260809065513_security_privacy_gate_a_contract.sql',
    ]
    expect(later).toEqual(allowed)
    for (const name of allowed) {
      const sql = readFileSync(join(MIGRATIONS, name), 'utf-8')
      expect(sql).not.toMatch(/CREATE OR REPLACE FUNCTION public\.publish_business_profile/)
      expect(sql).not.toMatch(/CREATE OR REPLACE FUNCTION public\.publish_university_profile/)
    }
    const wrappers = readFileSync(join(MIGRATIONS, allowed[7]!), 'utf-8')
    expect(wrappers).toMatch(/catalog_review_pending_domain/)
    expect(wrappers).toMatch(/auth\.uid\(\)/)
    const residueName = allowed[0]!
    const dashName = allowed[1]!
    const residue = readFileSync(join(MIGRATIONS, residueName), 'utf-8')
    expect(residue).toMatch(/viewer_approved_company_id/)
    const dash = readFileSync(join(MIGRATIONS, dashName), 'utf-8')
    expect(dash).toMatch(/university_profiles/)
    expect(dash).toMatch(/owner_user_id/)
    const catalog = readFileSync(join(MIGRATIONS, allowed[2]!), 'utf-8')
    expect(catalog).toMatch(/publish_directory_candidate/)
    const catalogShipping = readFileSync(join(MIGRATIONS, allowed[3]!), 'utf-8')
    expect(catalogShipping).not.toMatch(
      /CREATE(?: OR REPLACE)? FUNCTION public\.publish_directory_candidate/,
    )
    const lammahFoundations = readFileSync(join(MIGRATIONS, allowed[4]!), 'utf-8')
    expect(lammahFoundations).toMatch(/lammah_opportunities_entitled_read/)
    const lammahWorkflows = readFileSync(join(MIGRATIONS, allowed[5]!), 'utf-8')
    expect(lammahWorkflows).not.toMatch(
      /CREATE(?: OR REPLACE)? FUNCTION public\.publish_business_profile/,
    )
    const deferredCleanup = readFileSync(join(MIGRATIONS, allowed[6]!), 'utf-8')
    expect(deferredCleanup).toMatch(/DROP TABLE IF EXISTS public\.\w+_matches/)
    expect(deferredCleanup).toMatch(/DROP TABLE IF EXISTS public\.\w+_mandates/)
    expect(deferredCleanup).not.toMatch(
      /CREATE(?: OR REPLACE)? FUNCTION public\.publish_business_profile/,
    )
  })

  it('leaves publication RPC migration content unchanged at known markers', () => {
    const sql = readFileSync(
      join(MIGRATIONS, '20260730190003_profile_publication_rpcs.sql'),
      'utf-8',
    )
    expect(sql).toMatch(/publish_business_profile/)
    expect(sql).toMatch(/unpublish_business_profile/)
    expect(sql).toMatch(/publish_university_profile/)
    expect(sql).toMatch(/unpublish_university_profile/)
    expect(sql).toMatch(/set_config\('jid\.profile_publication_rpc', 'on', true\)/)
    expect(sql).not.toMatch(/CREATE OR REPLACE FUNCTION public\.suspend_profile/)
  })
})
