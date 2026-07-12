'use client'

import { useTranslations } from 'next-intl'
import { Link as LocaleLink } from '@/lib/i18n/navigation'
import { formatRelativeTime } from '@/lib/utils/format-relative-time'
import type { CompanyCardData } from '@/types/catalog'
import { cn } from '@/lib/utils'
import { CompanyLogo } from './company-logo'
import { OwnershipBadge } from './ownership-badge'
import { CatalogCta } from './catalog-cta'

type CompanyCardProps = {
  company: CompanyCardData
  className?: string
}

export function CompanyCard({ company, className }: CompanyCardProps) {
  const t = useTranslations('catalogPage.card')
  const displayName = company.name_ar ?? company.name_en
  const subtitle =
    company.name_ar && company.name_en && company.name_ar !== company.name_en
      ? company.name_en
      : null
  const sectorLabel = company.sector?.name_ar ?? company.sector?.name_en
  const regionLabel = company.region?.name_ar ?? company.region?.name_en
  const detailHref = company.slug ? `/catalog/${company.slug}` : null

  return (
    <article
      role="listitem"
      className={cn(
        'relative flex min-h-[220px] flex-col rounded-xl border border-border/40 bg-card p-4 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      {detailHref ? (
        <LocaleLink
          href={detailHref}
          className={cn(
            'absolute inset-0 z-10 rounded-xl',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          )}
          aria-label={t('viewRecord', { name: displayName })}
        />
      ) : null}

      <header className="relative z-20 flex items-start gap-3 pointer-events-none">
        <CompanyLogo name={displayName} logoUrl={company.logo_url} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-arabic text-base font-semibold text-foreground">
            {displayName}
          </h2>
          {subtitle ? (
            <p
              dir="ltr"
              className="mt-0.5 truncate font-latin text-sm font-normal text-foreground-400"
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {company.ownership_type ? (
          <OwnershipBadge type={company.ownership_type} />
        ) : null}
      </header>

      <div className="relative z-20 mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-arabic text-sm text-muted-foreground pointer-events-none">
        {sectorLabel ? <span>{sectorLabel}</span> : null}
        {sectorLabel && regionLabel ? (
          <span className="text-border" aria-hidden>
            ·
          </span>
        ) : null}
        {regionLabel ? <span>{regionLabel}</span> : null}
      </div>

      <div className="relative z-30 mt-4 pointer-events-auto">
        <CatalogCta
          slug={company.slug}
          careerPortalUrl={company.career_portal_url}
          linkStatus={company.link_status}
          hasPublishedProfile={company.hasPublishedProfile}
          onExternalClick={(event) => event.stopPropagation()}
        />
      </div>

      <footer className="relative z-20 mt-3 font-arabic text-xs text-foreground-400 pointer-events-none">
        {t('lastAudit', { time: formatRelativeTime(company.last_audit_at) })}
      </footer>
    </article>
  )
}
