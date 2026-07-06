import { Link } from '@/lib/i18n/navigation'
import type { ReactNode } from 'react'

type StaffLayoutProps = {
  children: ReactNode
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  return (
    <div className="min-h-screen bg-jid-beige/30">
      <header className="border-b border-jid-line bg-white">
        <div className="container-jid flex items-center justify-between py-4">
          <Link href="/staff/dashboard" className="text-lg font-semibold text-jid-olive">
            جِد — Staff
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/staff/dashboard" className="text-jid-ink/70 hover:text-jid-ink">
              Dashboard
            </Link>
            <Link href="/staff/claims/queue" className="text-jid-ink/70 hover:text-jid-ink">
              Claims queue
            </Link>
            <Link href="/staff/mentor-applications" className="text-jid-ink/70 hover:text-jid-ink">
              Mentor applications
            </Link>
            <Link href="/staff/audit" className="text-jid-ink/70 hover:text-jid-ink">
              Audit
            </Link>
          </nav>
        </div>
      </header>
      <main className="container-jid py-8">{children}</main>
    </div>
  )
}
