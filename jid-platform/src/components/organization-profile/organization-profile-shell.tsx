'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { DraftPublicationBoundary } from './draft-publication-boundary'
import { ProfileStateBadge } from './profile-state-badge'

export type OrganizationProfileSection =
  | 'overview'
  | 'identity'
  | 'details'
  | 'media'
  | 'preview'
  | 'reference'
  | 'correction'

export { OrganizationProfilePanel } from './organization-profile-section'

type OrganizationProfileShellProps = {
  orgKind: 'business' | 'university'
  displayName: string
  status: string
  profileId: string
  publicSlug?: string | null
  children: ReactNode
  sectionNav: ReactNode
  mobileHeader?: ReactNode
}

export function OrganizationProfileShell({
  orgKind,
  displayName,
  status,
  profileId,
  publicSlug = null,
  children,
  sectionNav,
  mobileHeader,
}: OrganizationProfileShellProps) {
  const t = useTranslations('organizationProfile.shell')
  const editHref = orgKind === 'business' ? '/company/profile/edit' : '/university/profile/edit'

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <header className="mb-6 space-y-3">
        {mobileHeader}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {orgKind === 'business' ? t('business') : t('university')}
            </p>
            <h1 className="text-2xl font-semibold text-foreground">{displayName}</h1>
          </div>
          <ProfileStateBadge status={status} />
        </div>
        <DraftPublicationBoundary
          profileId={profileId}
          profileType={orgKind}
          status={status}
          publicSlug={publicSlug}
          editHref={editHref}
        />
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">{sectionNav}</aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}
