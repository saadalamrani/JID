'use client'

import { useTranslations } from 'next-intl'
import { Link as LocaleLink } from '@/lib/i18n/navigation'
import { formatRelativeTime } from '@/lib/utils/format-relative-time'
import type { CatalogLookupOption, Company } from '@/types/catalog'
import { cn } from '@/lib/utils'
import { CompanyLogo } from './company-logo'
import { OwnershipBadge } from './ownership-badge'
import { CatalogCta } from './catalog-cta'
import { CorrectionSuggestionForm } from './correction-suggestion-form'

type CatalogDetailViewProps = {
  company: Company
  isDirectoryOwner: boolean
  sectors: CatalogLookupOption[]
  regions: CatalogLookupOption[]
}

export function CatalogDetailView({
  company,
  isDirectoryOwner,
  sectors,
  regions,
}: CatalogDetailViewProps) {
  const t = useTranslations('catalogPage.detail')
  const displayName = company.name_ar ?? company.name_en
  const subtitle =
    company.name_ar && company.name_en && company.name_ar !== company.name_en
      ? company.name_en
      : null
  const sectorLabel = company.sector?.name_ar ?? company.sector?.name_en
  const regionLabel = company.region?.name_ar ?? company.region?.name_en

  const primaryTagline = company.hasPublishedProfile ? company.profile_tagline_ar : null
  const primaryAbout = company.hasPublishedProfile
    ? company.profile_about_ar
    : company.description_ar

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <CompanyLogo name={displayName} logoUrl={company.logo_url} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <h1 className="font-arabic text-2xl font-semibold text-foreground">{displayName}</h1>
          {subtitle ? (
            <p dir="ltr" className="mt-1 font-latin text-sm text-foreground/60">
              {subtitle}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {sectorLabel ? <span>{sectorLabel}</span> : null}
            {sectorLabel && regionLabel ? (
              <span className="text-border" aria-hidden>
                ·
              </span>
            ) : null}
            {regionLabel ? <span>{regionLabel}</span> : null}
            {company.city ? (
              <>
                <span className="text-border" aria-hidden>
                  ·
                </span>
                <span>{company.city}</span>
              </>
            ) : null}
          </div>
        </div>
        {company.ownership_type ? <OwnershipBadge type={company.ownership_type} /> : null}
      </header>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground">{t('aboutHeading')}</h2>
        {primaryTagline ? (
          <p className="text-sm font-medium text-foreground/80">{primaryTagline}</p>
        ) : null}
        {primaryAbout ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{primaryAbout}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{t('aboutEmpty')}</p>
        )}

        {company.hasPublishedProfile && company.description_ar ? (
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="font-medium">{t('directoryRecordNote')}</span> {company.description_ar}
          </p>
        ) : null}
      </section>

      <div>
        <CatalogCta
          slug={company.slug}
          careerPortalUrl={company.career_portal_url}
          linkStatus={company.link_status}
          hasPublishedProfile={company.hasPublishedProfile}
        />
      </div>

      <footer className="text-xs text-foreground/50">
        {t('lastAudit', { time: formatRelativeTime(company.last_audit_at) })}
      </footer>

      {isDirectoryOwner ? (
        <aside className="rounded-lg border border-dashed border-border/80 bg-background/60 p-4">
          <p className="text-xs text-muted-foreground">{t('correctionIntro')}</p>
          <CorrectionSuggestionForm company={company} sectors={sectors} regions={regions} />
        </aside>
      ) : null}

      <LocaleLink
        href="/catalog"
        className={cn('inline-block text-sm text-primary underline-offset-4 hover:underline')}
      >
        {t('backToCatalog')}
      </LocaleLink>
    </article>
  )
}
