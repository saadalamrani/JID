'use client'

import { Check } from 'lucide-react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { CompanyLogo } from '@/app/[locale]/(public)/catalog/_components/company-logo'
import { OwnershipBadge } from '@/app/[locale]/(public)/catalog/_components/ownership-badge'
import { JobCard } from '@/app/[locale]/(public)/opportunities/_components/job-card'
import { Link as LocaleLink } from '@/lib/i18n/navigation'
import type { BusinessProfileViewProps } from '@/types/business-profile-public'
import { cn } from '@/lib/utils'

export function BusinessProfileView({
  profile,
  directory,
  openings,
  mode,
}: BusinessProfileViewProps) {
  const t = useTranslations('businessProfile.public')
  const locale = useLocale() as 'ar' | 'en'

  const displayName = profile.display_name_ar || t('unnamed')
  const tagline = profile.tagline_ar?.trim()
  const about =
    locale === 'ar'
      ? profile.about_ar?.trim() || profile.about_en?.trim()
      : profile.about_en?.trim() || profile.about_ar?.trim()
  const sectorLabel = directory.sector?.name_ar ?? directory.sector?.name_en
  const regionLabel = directory.region?.name_ar ?? directory.region?.name_en
  const directoryCatalogHref = directory.slug ? `/catalog/${directory.slug}` : '/catalog'

  return (
    <div className="space-y-8">
      <article className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        {profile.cover_image_url ? (
          <div
            className="h-36 w-full bg-cover bg-center sm:h-44"
            style={{ backgroundImage: `url(${profile.cover_image_url})` }}
            role="img"
            aria-label={t('coverAlt')}
          />
        ) : (
          <div className="h-36 w-full bg-gradient-to-br from-jid-olive-50 to-jid-beige-100 sm:h-44" />
        )}

        <div className="relative px-5 pb-6 pt-0 sm:px-8">
          <div className="-mt-8 mb-3">
            <CompanyLogo
              name={displayName}
              logoUrl={directory.logo_url}
              className="h-16 w-16 border-4 border-white shadow-sm sm:h-20 sm:w-20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-arabic text-2xl font-semibold text-foreground sm:text-3xl">
              {displayName}
            </h1>
            {profile.verified_badge ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
                  'border-jid-olive-200 bg-jid-olive-50 text-xs font-medium text-jid-olive-700',
                )}
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-jid-gold-600" aria-hidden />
                {t('verified')}
              </span>
            ) : null}
          </div>

          {profile.display_name_en?.trim() ? (
            <p className="mt-1 text-sm text-foreground/60" dir="ltr">
              {profile.display_name_en}
            </p>
          ) : null}

          {tagline ? (
            <p className="mt-2 text-sm font-medium text-foreground/80">{tagline}</p>
          ) : null}

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {profile.founded_year ? (
              <div>
                <dt className="text-foreground/60">{t('founded')}</dt>
                <dd className="font-medium">{profile.founded_year}</dd>
              </div>
            ) : null}
            {profile.employee_count_range ? (
              <div>
                <dt className="text-foreground/60">{t('teamSize')}</dt>
                <dd className="font-medium">
                  {t(`employeeRanges.${profile.employee_count_range}`, {
                    defaultValue: profile.employee_count_range,
                  })}
                </dd>
              </div>
            ) : null}
          </dl>

          {about ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
              {about}
            </p>
          ) : (
            <p className="mt-4 text-sm italic text-foreground/50">{t('noAbout')}</p>
          )}

          {mode === 'preview' ? (
            <p className="mt-4 text-xs text-muted-foreground">{t('strangerNote')}</p>
          ) : null}
        </div>
      </article>

      {profile.gallery.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-arabic text-lg font-semibold text-foreground">{t('gallery')}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {profile.gallery.map((item) => (
              <figure
                key={item.url}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={item.url}
                    alt={item.caption ?? t('galleryImageAlt')}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                {item.caption ? (
                  <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                    {item.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-arabic text-lg font-semibold text-foreground">{t('openingsTitle')}</h2>
        {openings.length > 0 ? (
          <ul className="grid list-none gap-4 sm:grid-cols-2">
            {openings.map((job) => (
              <li key={job.id}>
                <JobCard job={job} locale={locale} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-border/60 bg-background px-4 py-6 text-sm text-muted-foreground">
            {t('openingsEmpty')}
          </p>
        )}
      </section>

      <footer className="space-y-3 border-t border-border pt-6">
        <LocaleLink
          href={directoryCatalogHref}
          className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('viewInDirectory')}
        </LocaleLink>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {sectorLabel ? <span>{sectorLabel}</span> : null}
          {sectorLabel && regionLabel ? (
            <span className="text-border" aria-hidden>
              ·
            </span>
          ) : null}
          {regionLabel ? <span>{regionLabel}</span> : null}
          {directory.ownership_type ? (
            <OwnershipBadge type={directory.ownership_type} />
          ) : null}
        </div>
      </footer>
    </div>
  )
}
