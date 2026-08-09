import { Briefcase, Building2, GraduationCap, UserCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'

type LandingModule = {
  key: string
  href: string
  Icon: LucideIcon
}

/** Three public actors + opportunities surface — no fourth actor, no decorative module grid. */
const LANDING_MODULES: readonly LandingModule[] = [
  { key: 'profiles', href: '/signup', Icon: UserCircle },
  { key: 'jobs', href: '/opportunities', Icon: Briefcase },
  { key: 'catalog', href: '/catalog', Icon: Building2 },
  { key: 'universities', href: '/universities', Icon: GraduationCap },
] as const

/** Actor-led module strip (server-rendered). */
export async function ModulesShowcase() {
  const t = await getTranslations('landing.modules')

  return (
    <section className="border-b border-border bg-background py-16">
      <div className="container-jid">
        <header className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
            {t('title')}
          </h2>
          <p className="text-foreground/65 mt-3 text-sm leading-relaxed">{t('subtitle')}</p>
        </header>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LANDING_MODULES.map((module) => {
            const Icon = module.Icon
            return (
              <Link
                key={module.key}
                href={module.href}
                className="group flex h-full flex-col border-b border-border pb-5 transition-colors hover:border-jid-olive/40"
              >
                <Icon className="h-5 w-5 text-jid-olive" aria-hidden />
                <h3 className="mt-4 text-base font-semibold text-foreground group-hover:text-jid-olive">
                  {t(`items.${module.key}.title`)}
                </h3>
                <p className="text-foreground/65 mt-2 flex-1 text-sm leading-relaxed">
                  {t(`items.${module.key}.description`)}
                </p>
                <span className="mt-4 text-xs font-medium text-jid-olive">{t('explore')}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
