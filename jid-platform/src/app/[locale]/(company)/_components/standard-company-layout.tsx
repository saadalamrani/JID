import type { ReactNode } from 'react'
import {
  Building2,
  BriefcaseBusiness,
  CreditCard,
  UserRound,
} from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'

type StandardCompanyLayoutProps = {
  children: ReactNode
}

const NAV_ITEMS = [
  { href: '/company/profile', label: 'ملف الشركة', icon: Building2 },
  { href: '/jobs/new', label: 'نشر وظيفة', icon: BriefcaseBusiness },
  { href: '/billing', label: 'الفوترة', icon: CreditCard },
  { href: '/company/claim/reapply', label: 'بيانات الجهة', icon: UserRound },
] as const

export function StandardCompanyLayout({ children }: StandardCompanyLayoutProps) {
  return (
    <div className="container-jid grid min-h-[calc(100vh-3.5rem)] grid-cols-1 gap-6 py-6 md:grid-cols-[260px_1fr]">
      <aside className="rounded-2xl border border-jid-line bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-jid-ink/70">لوحة الشركة</h2>
        <nav className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-jid-ink transition hover:bg-jid-beige hover:text-jid-olive"
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
