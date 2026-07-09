'use client'

import { useTranslations } from 'next-intl'
import { Logo } from '@/components/brand/logo'
import { Link, usePathname } from '@/lib/i18n/navigation'
import { SYS_NAV_SECTIONS } from '@/lib/sys/nav'
import { cn } from '@/lib/utils'

/** Section 5.2 — persistent sidebar navigation. */
export function SysSidebar() {
  const t = useTranslations('sys.nav')
  const pathname = usePathname()

  return (
    <aside className="flex w-60 shrink-0 flex-col border-e border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <Link href="/sys/dashboard" className="inline-flex h-6 items-center overflow-hidden">
          <Logo size="sm" />
        </Link>
        <p className="mt-2 text-sm font-semibold text-primary">Sys</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('portalLabel')}</p>
      </div>

      <nav aria-label={t('ariaLabel')} className="flex-1 overflow-y-auto px-3 py-4">
        {SYS_NAV_SECTIONS.map((section) => (
          <div key={section.sectionKey} className="mb-5 last:mb-0">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t(`sections.${section.sectionKey}`)}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icon = item.icon

                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                        item.danger
                          ? 'text-destructive hover:bg-destructive/10 hover:text-destructive'
                          : isActive
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="flex-1">{t(`items.${item.key}`)}</span>
                      {item.danger ? (
                        <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                          {t('dangerBadge')}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
