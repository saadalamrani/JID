'use client'

import type { ReactNode } from 'react'
import { BarChart3, Building2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'

type UniversityLayoutProps = {
  children: ReactNode
}

/** Spec 05-B DEF-06 — AR/EN university shell nav. */
export function UniversityLayout({ children }: UniversityLayoutProps) {
  const t = useTranslations('university.nav')

  const items = [
    { href: '/university/dashboard', label: t('dashboard'), icon: BarChart3 },
    { href: '/universities', label: t('directory'), icon: Building2 },
  ] as const

  return (
    <div className="container-jid grid min-h-[calc(100vh-3.5rem)] grid-cols-1 gap-6 py-6 md:grid-cols-[260px_1fr]">
      <aside className="bg-background/40 rounded-2xl border border-border p-4">
        <h2 className="text-foreground/70 mb-3 text-sm font-semibold">{t('shellTitle')}</h2>
        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-card hover:text-primary"
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
