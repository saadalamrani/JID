import type { ReactNode } from 'react'
import { BarChart3, Building2 } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'

type UniversityLayoutProps = {
  children: ReactNode
}

const UNIVERSITY_NAV = [
  { href: '/company/dashboard', label: 'لوحة الإحصاءات', icon: BarChart3 },
  { href: '/company/profile', label: 'ملف الجامعة', icon: Building2 },
] as const

export function UniversityLayout({ children }: UniversityLayoutProps) {
  return (
    <div className="container-jid grid min-h-[calc(100vh-3.5rem)] grid-cols-1 gap-6 py-6 md:grid-cols-[260px_1fr]">
      <aside className="rounded-2xl border border-jid-line bg-jid-beige/40 p-4">
        <h2 className="mb-3 text-sm font-semibold text-jid-ink/70">لوحة الجامعة</h2>
        <nav className="space-y-2">
          {UNIVERSITY_NAV.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-jid-ink transition hover:bg-white hover:text-jid-olive"
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
