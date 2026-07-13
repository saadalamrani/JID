import { Link } from '@/lib/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import { CompanyLogo } from '@/app/[locale]/(public)/catalog/_components/company-logo'
import type { OwnerBusinessProfile } from '@/lib/profile/owner-business-profile'
import { BriefcaseBusiness, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

type CompanyDashboardProps = {
  profile: OwnerBusinessProfile | null
}

function statusPillClass(status: string) {
  switch (status) {
    case 'published':
      return 'bg-emerald-50 text-emerald-800'
    case 'draft':
      return 'bg-amber-50 text-amber-800'
    default:
      return 'bg-background text-foreground/70'
  }
}

export async function CompanyDashboard({ profile }: CompanyDashboardProps) {
  const t = await getTranslations('company.dashboard')

  if (!profile) {
    return (
      <section className="space-y-3 rounded-2xl border border-border bg-white p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-foreground/70">{t('noProfile')}</p>
        <Link
          href="/company/create-profile"
          className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          {t('createProfileCta')}
        </Link>
      </section>
    )
  }

  const quickLinks = [
    { href: '/jobs', label: t('links.jobs'), icon: BriefcaseBusiness },
    { href: '/company/profile/edit', label: t('links.settings'), icon: Settings },
    { href: '/jobs', label: t('links.applicants'), icon: Users },
  ] as const

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-6">
        <CompanyLogo
          name={profile.display_name_ar}
          logoUrl={profile.directory_logo_url}
          className="h-14 w-14"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-foreground">{profile.display_name_ar}</h1>
          {profile.tagline_ar ? (
            <p className="mt-1 text-sm text-foreground/70">{profile.tagline_ar}</p>
          ) : null}
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium',
            statusPillClass(profile.status),
          )}
        >
          {t(`status.${profile.status}`, { defaultValue: profile.status })}
        </span>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {quickLinks.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 transition hover:border-primary/30 hover:shadow-sm"
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </Link>
          )
        })}
      </div>

      <p className="text-sm text-foreground/70">{t('placeholderMetrics')}</p>
    </section>
  )
}
