'use client'

import { useTranslations } from 'next-intl'
import { CompanyLogo } from '@/app/[locale]/(public)/catalog/_components/company-logo'
import type { Company } from '@/types/catalog'

type DirectoryReferenceCardProps = {
  directory: Company
}

export function DirectoryReferenceCard({ directory }: DirectoryReferenceCardProps) {
  const t = useTranslations('organizationProfile.directoryReference')

  const displayName = directory.name_ar ?? directory.name_en

  return (
    <article className="rounded-xl border border-dashed border-border bg-background/50 p-4">
      <h3 className="text-sm font-semibold text-foreground">{t('title')}</h3>
      <p className="mt-1 text-xs text-foreground/60">{t('readOnlyNote')}</p>

      <div className="mt-4 flex items-start gap-3">
        <CompanyLogo name={displayName} logoUrl={directory.logo_url} className="h-12 w-12" />
        <dl className="min-w-0 space-y-1 text-sm">
          <div>
            <dt className="text-xs text-foreground/50">{t('officialName')}</dt>
            <dd className="font-medium text-foreground">{displayName}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground/50">{t('entityType')}</dt>
            <dd className="text-foreground/80">{directory.entity_type}</dd>
          </div>
          {directory.website_url ? (
            <div>
              <dt className="text-xs text-foreground/50">{t('website')}</dt>
              <dd className="truncate text-foreground/80" dir="ltr">
                {directory.website_url}
              </dd>
            </div>
          ) : (
            <p className="text-xs text-foreground/50">{t('noWebsite')}</p>
          )}
        </dl>
      </div>
    </article>
  )
}
