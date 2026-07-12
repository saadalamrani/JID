import type { ReactNode } from 'react'
import {
  Building2,
  BriefcaseBusiness,
  CreditCard,
  LayoutDashboard,
  Settings,
} from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import { getTranslations } from 'next-intl/server'

type StandardCompanyLayoutProps = {
  children: ReactNode
}

export async function StandardCompanyLayout({ children }: StandardCompanyLayoutProps) {
  const t = await getTranslations('company.nav')

  const NAV_ITEMS = [
    { href: '/company/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/company/profile/edit', label: t('profile'), icon: Building2 },
    { href: '/jobs/new', label: t('postJob'), icon: BriefcaseBusiness },
    { href: '/billing', label: t('billing'), icon: CreditCard },
    { href: '/company/profile/edit', label: t('settings'), icon: Settings },
  ] as const

  return (
    <div className="container-jid grid min-h-[calc(100vh-3.5rem)] grid-cols-1 gap-6 py-6 md:grid-cols-[260px_1fr]">
      <aside className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground/70">{t('panelTitle')}</h2>
        <nav className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-background hover:text-primary"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <section className="min-w-0">{children}</section>
    </div>
  )
}
