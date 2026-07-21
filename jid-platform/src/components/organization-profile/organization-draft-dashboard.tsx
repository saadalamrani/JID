'use client'

import { Link } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { CompanyLogo } from '@/app/[locale]/(public)/catalog/_components/company-logo'
import { DraftPublicationBoundary } from '@/components/organization-profile/draft-publication-boundary'
import { DirectoryReferenceCard } from '@/components/organization-profile/directory-reference-card'
import { HonestEmptyState } from '@/components/organization-profile/honest-empty-state'
import { ProfileStateBadge } from '@/components/organization-profile/profile-state-badge'
import { RequiredInformationChecklist } from '@/components/organization-profile/required-information-checklist'
import {
  buildBusinessProfileChecklist,
  buildUniversityProfileChecklist,
} from '@/lib/profile/organization-profile-checklist'
import type { OwnerBusinessProfile } from '@/lib/profile/owner-business-profile'
import type { OwnerUniversityProfile } from '@/lib/profile/owner-university-profile'
import type { Company } from '@/types/catalog'
import { Button } from '@/components/ui/button'

type OrganizationDraftDashboardProps =
  | {
      orgKind: 'business'
      profile: OwnerBusinessProfile
      directory: Company
    }
  | {
      orgKind: 'university'
      profile: OwnerUniversityProfile
      directory: Company
    }

export function OrganizationDraftDashboard(props: OrganizationDraftDashboardProps) {
  const t = useTranslations('organizationProfile.dashboard')
  const { profile, directory, orgKind } = props

  const checklist =
    orgKind === 'business'
      ? buildBusinessProfileChecklist(profile)
      : buildUniversityProfileChecklist(profile)

  const editHref = orgKind === 'business' ? '/company/profile/edit' : '/university/profile/edit'
  const previewHref =
    orgKind === 'business' ? '/company/profile/preview' : '/university/profile/preview'

  const logoUrl = profile.directory_logo_url

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-6">
        <CompanyLogo
          name={profile.display_name_ar}
          logoUrl={logoUrl}
          className="h-14 w-14"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase text-foreground/50">
            {orgKind === 'business' ? t('businessLabel') : t('universityLabel')}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">{profile.display_name_ar}</h1>
        </div>
        <ProfileStateBadge status={profile.status} />
      </header>

      <DraftPublicationBoundary />

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">{t('checklistTitle')}</h2>
          <p className="mt-1 text-sm text-foreground/70">{t('checklistDescription')}</p>
          <div className="mt-4">
            <RequiredInformationChecklist items={checklist} />
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-white p-5">
          <h2 className="text-lg font-semibold text-foreground">{t('directoryTitle')}</h2>
          <p className="mt-1 text-sm text-foreground/70">{t('directoryDescription')}</p>
          <div className="mt-4">
            <DirectoryReferenceCard directory={directory} />
          </div>
        </article>
      </div>

      <article className="rounded-2xl border border-border bg-white p-5">
        <h2 className="text-lg font-semibold text-foreground">
          {orgKind === 'business' ? t('opportunitiesTitle') : t('programsTitle')}
        </h2>
        <div className="mt-4">
          <HonestEmptyState
            title={orgKind === 'business' ? t('opportunitiesEmptyTitle') : t('programsEmptyTitle')}
            description={
              orgKind === 'business'
                ? t('opportunitiesEmptyDescription')
                : t('programsEmptyDescription')
            }
          />
        </div>
      </article>

      <div className="flex flex-wrap gap-3">
        <Button type="button" asChild className="min-h-11">
          <Link href={editHref}>{t('manageProfile')}</Link>
        </Button>
        <Button type="button" variant="outline" asChild className="min-h-11">
          <Link href={previewHref}>{t('openPreview')}</Link>
        </Button>
      </div>
    </section>
  )
}
