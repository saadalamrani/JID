import type { ReactNode } from 'react'
import { CookieConsent } from '@/app/[locale]/(public)/_components/cookie-consent'
import { PublicFooter } from '@/app/[locale]/(public)/_components/public-footer'
import { PublicNav } from '@/app/[locale]/(public)/_components/public-nav'

type PublicLayoutProps = {
  children: ReactNode
}

/** Section 4.1 — public marketing shell (nav + main + footer + cookie banner). */
export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-jid-beige">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <CookieConsent />
    </div>
  )
}
