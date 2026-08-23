'use client'

import { useState, type ReactNode } from 'react'
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CreditCard,
  LayoutDashboard,
  Menu,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { cn } from '@/lib/utils'

export type ActorSidebarIconName =
  | 'layout-dashboard'
  | 'building'
  | 'briefcase'
  | 'credit-card'
  | 'bar-chart'

export type ActorSidebarNavItem = {
  href: string
  label: string
  icon: ActorSidebarIconName
}

const ICONS = {
  'layout-dashboard': LayoutDashboard,
  building: Building2,
  briefcase: BriefcaseBusiness,
  'credit-card': CreditCard,
  'bar-chart': BarChart3,
} as const

type ActorSidebarShellProps = {
  panelTitle: string
  items: readonly ActorSidebarNavItem[]
  children: ReactNode
}

function NavList({
  items,
  onNavigate,
  activePathname,
}: {
  items: readonly ActorSidebarNavItem[]
  onNavigate?: () => void
  activePathname: string
}) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon]
        const active = activePathname === item.href || activePathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-foreground hover:bg-background hover:text-primary',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * Shared responsive actor workspace shell: a persistent sidebar at `lg` and
 * above, collapsing into a start-anchored nav drawer below it. Fixes the
 * confirmed defect where Company/University fixed-width sidebars (`w-[260px]`
 * grid columns) rendered full-width above content on 390–768px viewports
 * instead of transforming into a Sheet/Drawer.
 */
export function ActorSidebarShell({ panelTitle, items, children }: ActorSidebarShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="container-jid min-h-[calc(100vh-3.5rem)] py-4 lg:grid lg:grid-cols-[260px_1fr] lg:gap-6 lg:py-6">
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <h1 className="text-base font-semibold text-foreground">{panelTitle}</h1>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cn(
            'inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
          aria-label={panelTitle}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <aside className="hidden rounded-2xl border border-border bg-card p-4 lg:block lg:self-start">
        <h2 className="mb-3 text-sm font-semibold text-foreground/70">{panelTitle}</h2>
        <NavList items={items} activePathname={pathname ?? ''} />
      </aside>

      <BottomSheet
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        side="start"
        title={panelTitle}
      >
        <NavList items={items} onNavigate={() => setDrawerOpen(false)} activePathname={pathname ?? ''} />
      </BottomSheet>

      <section className="min-w-0">{children}</section>
    </div>
  )
}
