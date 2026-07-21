'use client'

import { Check } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { CompanyLogo } from '@/app/[locale]/(public)/catalog/_components/company-logo'
import type { DirectoryReferenceData } from '@/types/business-profile-public'
import { cn } from '@/lib/utils'

export type UniversityProfilePreviewData = {
  id: string
  display_name_ar: string
  display_name_en: string | null
  about_ar: string | null
  about_en: string | null
  university_type: string | null
  established_year: number | null
  cover_image_url: string | null
  verified_badge: boolean
}

type UniversityProfileViewProps = {
  profile: UniversityProfilePreviewData
  directory: DirectoryReferenceData
  mode: 'public' | 'preview'
}

export function UniversityProfileView({ profile, directory, mode }: UniversityProfileViewProps) {
  const t = useTranslations('organizationProfile.universityPreview')
  const locale = useLocale() as 'ar' | 'en'

  const displayName = profile.display_name_ar || t('unnamed')
  const about =
    locale === 'ar'
      ? profile.about_ar?.trim() || profile.about_en?.trim()
      : profile.about_en?.trim() || profile.about_ar?.trim()

  return (
    <div className="space-y-6">
      {mode === 'preview' ? (
        <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground/80">
          {t('banner')}
        </p>
      ) : null}

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

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {profile.university_type ? (
              <div>
                <dt className="text-foreground/60">{t('institutionType')}</dt>
                <dd className="font-medium">
                  {t(`types.${profile.university_type}`, { defaultValue: profile.university_type })}
                </dd>
              </div>
            ) : null}
            {profile.established_year ? (
              <div>
                <dt className="text-foreground/60">{t('established')}</dt>
                <dd className="font-medium">{profile.established_year}</dd>
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
        </div>
      </article>
    </div>
  )
}
