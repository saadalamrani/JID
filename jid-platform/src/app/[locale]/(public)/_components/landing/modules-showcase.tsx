import {
  Activity,
  Briefcase,
  Building2,
  FileText,
  GraduationCap,
  Handshake,
  LayoutGrid,
  UserCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'

type LandingModule = {
  key: string
  href: string
  Icon: LucideIcon
  accent: 'olive' | 'gold'
}

/** Section 5.4 — eight shipped product modules with verified routes. */
const LANDING_MODULES: readonly LandingModule[] = [
  { key: 'jobs', href: '/opportunities', Icon: Briefcase, accent: 'olive' },
  { key: 'catalog', href: '/catalog', Icon: Building2, accent: 'gold' },
  { key: 'mentors', href: '/mentors', Icon: Handshake, accent: 'olive' },
  { key: 'pulse', href: '/pulse', Icon: Activity, accent: 'gold' },
  { key: 'universities', href: '/universities', Icon: GraduationCap, accent: 'olive' },
  { key: 'profiles', href: '/signup', Icon: UserCircle, accent: 'gold' },
  { key: 'radar', href: '/signup', Icon: LayoutGrid, accent: 'olive' },
  { key: 'cv', href: '/signup', Icon: FileText, accent: 'gold' },
] as const

/** Section 5.4 — module grid (server-rendered). */
export async function ModulesShowcase() {
  const t = await getTranslations('landing.modules')

  return (
    <section className="border-b border-border bg-background py-16">
      <div className="container-jid">
        <header className="mx-auto max-w-2xl text-center">
          <h2 className="font-arabic text-2xl font-semibold text-foreground md:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/65">{t('subtitle')}</p>
        </header>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LANDING_MODULES.map((module) => {
            const Icon = module.Icon
            const accentClass =
              module.accent === 'olive'
                ? 'bg-primary/10 text-primary'
                : 'bg-accent/10 text-accent'

            return (
              <Link
                key={module.key}
                href={module.href}
                className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${accentClass}`}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-arabic text-base font-semibold text-foreground group-hover:text-primary">
                  {t(`items.${module.key}.title`)}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground/65">
                  {t(`items.${module.key}.description`)}
                </p>
                <span className="mt-4 text-xs font-medium text-primary">{t('explore')}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
