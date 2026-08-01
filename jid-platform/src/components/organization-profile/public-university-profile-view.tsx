'use client'

import { useLocale, useTranslations } from 'next-intl'
import { CompanyLogo } from '@/app/[locale]/(public)/catalog/_components/company-logo'
import { Link as LocaleLink } from '@/lib/i18n/navigation'
import type { PublicPublishedUniversityProfile } from '@/lib/queries/published-profile'

type PublicUniversityProfileViewProps = {
  profile: PublicPublishedUniversityProfile
  directory: {
    id: string
    slug: string | null
    logo_url?: string | null
  }
}

export function PublicUniversityProfileView({
  profile,
  directory,
}: PublicUniversityProfileViewProps) {
  const t = useTranslations('organizationProfile.universityPublic')
  const locale = useLocale() as 'ar' | 'en'

  const displayName =
    locale === 'ar'
      ? profile.display_name_ar.trim() || profile.display_name_en?.trim() || t('unnamed')
      : profile.display_name_en?.trim() || profile.display_name_ar.trim() || t('unnamed')

  const secondaryName =
    locale === 'ar'
      ? profile.display_name_en?.trim() &&
        profile.display_name_en.trim() !== profile.display_name_ar.trim()
        ? profile.display_name_en.trim()
        : null
      : profile.display_name_ar.trim() &&
          profile.display_name_ar.trim() !== (profile.display_name_en?.trim() ?? '')
        ? profile.display_name_ar.trim()
        : null

  const about =
    locale === 'ar'
      ? profile.about_ar?.trim() || profile.about_en?.trim() || null
      : profile.about_en?.trim() || profile.about_ar?.trim() || null

  const domains = (profile.verified_domains ?? []).map((d) => d.trim()).filter(Boolean)
  const directoryHref = directory.slug ? `/catalog/${directory.slug}` : '/catalog'

  return (
    <div className="space-y-8">
      <article className="overflow-hidden rounded-lg border border-border bg-card">
        {profile.cover_image_url ? (
          <div
            className="h-36 w-full bg-cover bg-center sm:h-44"
            style={{ backgroundImage: `url(${profile.cover_image_url})` }}
            role="img"
            aria-label={t('coverAlt')}
          />
        ) : (
          <div className="h-36 w-full bg-jid-beige sm:h-44" aria-hidden />
        )}

        <div className="relative px-5 pb-6 pt-0 sm:px-8">
          <div className="-mt-8 mb-3">
            <CompanyLogo
              name={displayName}
              logoUrl={directory.logo_url ?? null}
              className="h-16 w-16 border-4 border-card sm:h-20 sm:w-20"
            />
          </div>

          <h1 className="break-words font-arabic text-2xl font-semibold text-foreground sm:text-3xl">
            {displayName}
          </h1>

          {secondaryName ? (
            <p
              className="mt-1 break-words text-sm text-foreground/60"
              dir={locale === 'ar' ? 'ltr' : 'rtl'}
            >
              {secondaryName}
            </p>
          ) : null}

          {profile.established_year != null ? (
            <dl className="mt-4 text-sm">
              <div>
                <dt className="text-foreground/60">{t('established')}</dt>
                <dd className="font-medium tabular-nums">{profile.established_year}</dd>
              </div>
            </dl>
          ) : null}

          {about ? (
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/80">
              {about}
            </p>
          ) : null}

          {domains.length > 0 ? (
            <div className="mt-5">
              <h2 className="text-sm font-medium text-foreground/70">{t('verifiedDomains')}</h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {domains.map((domain) => (
                  <li
                    key={domain}
                    className="max-w-full break-all rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground/80"
                    dir="ltr"
                  >
                    {domain}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </article>

      <p className="text-sm text-muted-foreground">
        <LocaleLink
          href={directoryHref}
          className="text-primary underline-offset-4 hover:underline"
        >
          {t('directoryLink')}
        </LocaleLink>
      </p>
    </div>
  )
}
