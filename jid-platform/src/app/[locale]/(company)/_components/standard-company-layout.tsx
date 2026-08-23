import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { ActorSidebarShell, type ActorSidebarNavItem } from '@/components/shell/actor-sidebar-shell'

type StandardCompanyLayoutProps = {
  children: ReactNode
}

export async function StandardCompanyLayout({ children }: StandardCompanyLayoutProps) {
  const t = await getTranslations('company.nav')

  // No distinct Settings page — omit duplicate Profile/Settings href to /company/profile/edit.
  // Icon names (not components) so the server layout can pass serializable props
  // into the client sidebar shell.
  const NAV_ITEMS: ActorSidebarNavItem[] = [
    { href: '/company/dashboard', label: t('dashboard'), icon: 'layout-dashboard' },
    { href: '/company/profile/edit', label: t('profile'), icon: 'building' },
    { href: '/jobs', label: t('jobs'), icon: 'briefcase' },
    { href: '/jobs/new', label: t('postJob'), icon: 'briefcase' },
    { href: '/billing', label: t('billing'), icon: 'credit-card' },
  ]

  return (
    <ActorSidebarShell panelTitle={t('panelTitle')} items={NAV_ITEMS}>
      {children}
    </ActorSidebarShell>
  )
}
