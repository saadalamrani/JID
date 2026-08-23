import { BarChart3 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { ActorSidebarShell, type ActorSidebarNavItem } from '@/components/shell/actor-sidebar-shell'
import type { ReactNode } from 'react'

type UniversityLayoutProps = {
  children: ReactNode
}

/**
 * Spec 05-B DEF-06 — AR/EN university shell nav.
 * FOLLOW-UP: this shell still lives under the company route group and is imported by
 * `(university)/layout.tsx` — extract/re-export is deferred (behavior-preserving only).
 * Constitution: University Directory is not a University-shell product affordance.
 */
export async function UniversityLayout({ children }: UniversityLayoutProps) {
  const t = await getTranslations('university.nav')

  const items: ActorSidebarNavItem[] = [
    { href: '/university/dashboard', label: t('dashboard'), icon: BarChart3 },
  ]

  return (
    <ActorSidebarShell panelTitle={t('shellTitle')} items={items}>
      {children}
    </ActorSidebarShell>
  )
}
