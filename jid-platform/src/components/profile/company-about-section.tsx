'use client'

import { Calendar, MapPin, Users } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { CompanyProfileRecord } from '@/lib/profile/types'

type CompanyAboutSectionProps = {
  company: CompanyProfileRecord
}

type OfficeLocation = {
  city?: string
  country?: string
  label?: string
}

function formatOfficeLocations(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') {
        const loc = item as OfficeLocation
        if (loc.label) return loc.label
        const parts = [loc.city, loc.country].filter(Boolean)
        return parts.length > 0 ? parts.join(', ') : null
      }
      return null
    })
    .filter((s): s is string => Boolean(s))
}

export function CompanyAboutSection({ company }: CompanyAboutSectionProps) {
  const t = useTranslations('profile.company.public')
  const locale = useLocale()
  const tagline =
    locale === 'ar' && company.tagline_ar ? company.tagline_ar : company.tagline_en ?? company.tagline_ar
  const about =
    locale === 'ar' && company.about_long_ar
      ? company.about_long_ar
      : company.about_long_en ?? company.about_long_ar
  const offices = formatOfficeLocations(company.office_locations)

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-medium text-muted-foreground">{t('aboutTitle')}</h2>

      {tagline ? <p className="text-sm font-medium text-primary">{tagline}</p> : null}

      {about ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{about}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{t('aboutEmpty')}</p>
      )}

      <dl className="grid gap-3 sm:grid-cols-2">
        {company.founded_year ? (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div>
              <dt className="text-muted-foreground">{t('foundedYearLabel')}</dt>
              <dd>{company.founded_year}</dd>
            </div>
          </div>
        ) : null}
        {company.employee_count_range ? (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div>
              <dt className="text-muted-foreground">{t('employeeCountLabel')}</dt>
              <dd>{company.employee_count_range}</dd>
            </div>
          </div>
        ) : null}
      </dl>

      {offices.length > 0 ? (
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {t('officeLocationsLabel')}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {offices.map((office) => (
              <li
                key={office}
                className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground"
              >
                {office}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
