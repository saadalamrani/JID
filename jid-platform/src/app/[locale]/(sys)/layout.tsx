import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Link } from '@/lib/i18n/navigation'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

type SysLayoutProps = {
  children: ReactNode
}

export default function SysLayout({ children }: SysLayoutProps) {
  return (
    <div className="min-h-screen bg-jid-beige/30">
        <header className="border-b border-jid-line bg-white">
          <div className="container-jid flex items-center justify-between py-4">
            <Link href="/sys/dashboard" className="text-lg font-semibold text-jid-olive">
              جِد — Sys
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/sys/dashboard" className="text-jid-ink/70 hover:text-jid-ink">
                Dashboard
              </Link>
            <Link href="/sys/staff" className="text-jid-ink/70 hover:text-jid-ink">
              Staff
            </Link>
            <Link href="/sys/audit" className="text-jid-ink/70 hover:text-jid-ink">
              Audit
            </Link>
            </nav>
          </div>
        </header>
        <main className="container-jid py-8">{children}</main>
    </div>
  )
}
