import type { ReactNode } from 'react'
import {
  Building2,
  BriefcaseBusiness,
  CreditCard,
  LayoutDashboard,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { ActorSidebarShell, type ActorSidebarNavItem } from '@/components/shell/actor-sidebar-shell'

type StandardCompanyLayoutProps = {
  children: ReactNode
}

export async function StandardCompanyLayout({ children }: StandardCompanyLayoutProps) {
  const t = await getTranslations('company.nav')

  // No distinct Settings page — omit duplicate Profile/Settings href to /company/profile/edit.
  const NAV_ITEMS: ActorSidebarNavItem[] = [
    { href: '/company/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/company/profile/edit', label: t('profile'), icon: Building2 },
    { href: '/jobs', label: t('jobs'), icon: BriefcaseBusiness },
    { href: '/jobs/new', label: t('postJob'), icon: BriefcaseBusiness },
    { href: '/billing', label: t('billing'), icon: CreditCard },
  ]

  return (
    <ActorSidebarShell panelTitle={t('panelTitle')} items={NAV_ITEMS}>
      {children}
    </ActorSidebarShell>
  )
}
