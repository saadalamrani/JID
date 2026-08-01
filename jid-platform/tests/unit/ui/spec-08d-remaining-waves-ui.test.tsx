import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ar from '../../../messages/ar.json'
import en from '../../../messages/en.json'

vi.mock('@/lib/profile/publication-actions', () => ({
  publishOwnedProfileAction: vi.fn(),
  unpublishOwnedProfileAction: vi.fn(),
}))

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, values?: Record<string, string>) => {
    const parts = `${namespace}.${key}`.split('.')
    let cursor: unknown = en
    for (const part of parts) {
      cursor = (cursor as Record<string, unknown> | undefined)?.[part]
    }
    if (typeof cursor === 'string') {
      return cursor.replace(/\{(\w+)\}/g, (_, name: string) => values?.[name] ?? `{${name}}`)
    }
    return values?.defaultValue ?? key
  },
  useLocale: () => 'en',
}))

vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}))

import { ProfileStateBadge } from '@/components/organization-profile/profile-state-badge'
import { DraftPublicationBoundary } from '@/components/organization-profile/draft-publication-boundary'

function leafKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return prefix ? [prefix] : []
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    leafKeys(v, prefix ? `${prefix}.${k}` : k),
  )
}

function readSrc(rel: string): string {
  return readFileSync(join(process.cwd(), rel), 'utf8')
}

describe('Spec 08-D — W-Lifecycle visual honesty', () => {
  it('uses shared OrgOutcomePanel on pending/rejected/reapply surfaces', () => {
    expect(readSrc('src/components/entity/pending-review-view.tsx')).toMatch(/OrgOutcomePanel/)
    expect(readSrc('src/components/entity/pending-review-view.tsx')).not.toMatch(
      /shadow-sm|bg-gradient|tracking-/,
    )
    expect(readSrc('src/components/entity/rejected-verification-panel.tsx')).toMatch(/OrgOutcomePanel/)
    expect(readSrc('src/app/[locale]/(company)/company/verification/reapply/page.tsx')).toMatch(
      /formatDateTime/,
    )
    expect(readSrc('src/app/[locale]/(university)/university/reapply/page.tsx')).toMatch(
      /formatDateTime/,
    )
    expect(readSrc('src/app/[locale]/(university)/university/reapply/page.tsx')).not.toMatch(
      /toLocaleString\('en-US'\)/,
    )
  })

  it('keeps shared rejected panel route contracts in page sources', () => {
    const uni = readSrc('src/app/[locale]/(university)/university/rejected/page.tsx')
    const biz = readSrc('src/app/[locale]/(company)/company/verification-rejected/page.tsx')
    expect(uni).toMatch(/href="\/university\/reapply"/)
    expect(biz).toMatch(/href="\/company\/verification\/reapply"/)
    expect(uni).toMatch(/formatDateTime/)
    expect(biz).toMatch(/formatDateTime/)
    expect(uni).toMatch(/RejectedVerificationPanel/)
    expect(biz).toMatch(/RejectedVerificationPanel/)
  })

  it('keeps approved-without-profile copy explicit and Claim-free', () => {
    expect(en.entity.approvedWithoutProfile.business.message.length).toBeGreaterThan(10)
    expect(ar.entity.approvedWithoutProfile.business.message.length).toBeGreaterThan(10)
    expect(en.entity.approvedWithoutProfile.business.message).not.toMatch(/Claim|مطالبة/i)
    expect(ar.entity.approvedWithoutProfile.business.message).not.toMatch(/مطالبة/)
    expect(readSrc('src/components/entity/approved-without-profile-notice.tsx')).toMatch(
      /border-s-jid-gold/,
    )
  })
})

describe('Spec 08-D — W-ProfileMgmt / W-Publication visual honesty', () => {
  it('uses semantic status badge classes without raw amber/emerald piles', () => {
    const { container } = render(<ProfileStateBadge status="draft" />)
    expect(container.innerHTML).toMatch(/jid-beige|jid-gold|primary|destructive/)
    expect(container.innerHTML).not.toMatch(/border-amber-200|border-emerald-200|border-red-200/)
  })

  it('shows suspended publication boundary without publish controls', () => {
    render(
      <DraftPublicationBoundary
        profileId="p1"
        profileType="business"
        status="suspended"
        editHref="/company/profile/edit"
      />,
    )
    expect(screen.getByText(en.organizationProfile.publication.suspendedTitle)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: en.organizationProfile.publication.publish })).toBeNull()
    expect(screen.queryByRole('button', { name: en.organizationProfile.publication.unpublish })).toBeNull()
  })

  it('has AR/EN parity for organizationProfile.shell', () => {
    const enKeys = leafKeys(en.organizationProfile.shell).sort()
    const arKeys = leafKeys(ar.organizationProfile.shell).sort()
    expect(enKeys).toEqual(arKeys)
    expect(en.organizationProfile.shell.business).toBeTruthy()
    expect(ar.organizationProfile.shell.university).toBeTruthy()
  })

  it('removes decorative gradients from owned/public profile heroes', () => {
    for (const rel of [
      'src/components/profiles/business-profile-view.tsx',
      'src/components/organization-profile/university-profile-view.tsx',
      'src/components/organization-profile/public-university-profile-view.tsx',
    ]) {
      const src = readSrc(rel)
      expect(src).not.toMatch(/bg-gradient-to-br/)
      expect(src).not.toMatch(/shadow-sm/)
      expect(src).toMatch(/bg-jid-beige/)
    }
  })

  it('does not introduce Claim terminology on touched Catalog CTA', () => {
    const src = readSrc('src/app/[locale]/(public)/catalog/_components/catalog-cta.tsx')
    expect(src).not.toMatch(/Claim|مطالبة/)
    expect(en.catalogPage.cta.jidProfile).not.toMatch(/Claim|مطالبة/i)
    expect(ar.catalogPage.cta.jidProfile).not.toMatch(/مطالبة/)
  })
})
