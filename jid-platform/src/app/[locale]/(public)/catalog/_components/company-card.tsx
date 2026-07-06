'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Link as LocaleLink } from '@/lib/i18n/navigation'
import { formatRelativeTime } from '@/lib/utils/format-relative-time'
import type { CompanyCardData } from '@/types/catalog'
import { cn } from '@/lib/utils'
import { CompanyLogo } from './company-logo'
import { OwnershipBadge } from './ownership-badge'

type CompanyCardProps = {
  company: CompanyCardData
  className?: string
}

export function CompanyCard({ company, className }: CompanyCardProps) {
  const displayName = company.name_ar ?? company.name_en
  const subtitle =
    company.name_ar && company.name_en && company.name_ar !== company.name_en
      ? company.name_en
      : null
  const sectorLabel = company.sector?.name_ar ?? company.sector?.name_en
  const regionLabel = company.region?.name_ar ?? company.region?.name_en
  const isHealthy = company.link_status === 'healthy'
  const profileHref = company.slug ? `/companies/${company.slug}` : null

  return (
    <article
      role="listitem"
      className={cn(
        'relative flex min-h-[220px] flex-col rounded-xl border border-jid-line/40 bg-white p-4 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      {profileHref ? (
        <LocaleLink
          href={profileHref}
          className={cn(
            'absolute inset-0 z-10 rounded-xl',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive focus-visible:ring-offset-2',
          )}
          aria-label={`عرض ملف ${displayName}`}
        />
      ) : null}

      <header className="relative z-20 flex items-start gap-3 pointer-events-none">
        <CompanyLogo name={displayName} logoUrl={company.logo_url} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-arabic text-base font-semibold text-jid-ink">
            {displayName}
          </h2>
          {subtitle ? (
            <p
              dir="ltr"
              className="mt-0.5 truncate font-latin text-sm font-normal text-jid-ink-400"
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {company.ownership_type ? (
          <OwnershipBadge type={company.ownership_type} />
        ) : null}
      </header>

      <div className="relative z-20 mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-arabic text-sm text-jid-ink/70 pointer-events-none">
        {sectorLabel ? <span>{sectorLabel}</span> : null}
        {sectorLabel && regionLabel ? (
          <span className="text-jid-line" aria-hidden>
            ·
          </span>
        ) : null}
        {regionLabel ? <span>{regionLabel}</span> : null}
      </div>

      <div className="relative z-30 mt-4 pointer-events-auto">
        {isHealthy && company.career_portal_url ? (
          <Link
            href={company.career_portal_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5',
              'font-arabic text-sm font-medium',
              'bg-jid-olive text-jid-beige transition-colors hover:bg-jid-olive-600 active:bg-jid-olive-700',
            )}
            onClick={(event) => event.stopPropagation()}
          >
            بوابة التوظيف
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        ) : (
          <span
            role="button"
            tabIndex={-1}
            className={cn(
              'inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5',
              'font-arabic text-sm font-medium',
              'bg-jid-line/30 text-jid-ink-500',
              'pointer-events-none',
            )}
            aria-disabled="true"
            aria-label="الرابط قيد التحديث"
          >
            الرابط قيد التحديث
          </span>
        )}
      </div>

      <footer className="relative z-20 mt-3 font-arabic text-xs text-jid-ink-400 pointer-events-none">
        آخر فحص للرابط: {formatRelativeTime(company.last_audit_at)}
      </footer>
    </article>
  )
}
