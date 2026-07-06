import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { SysShell } from '@/components/sys/sys-shell'
import { isSysAuthRoute } from '@/lib/sys/routes'

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

/**
 * Section 5.1 — /sys route group.
 *
 * MANUAL DEVOPS (not code): add Vercel Firewall Rules to IP allow-list `/sys/*`
 * in production for defense in depth beyond these application guards.
 *
 * Auth routes (`/sys/login`, `/sys/mfa`) bypass the shell guards.
 * All other `/sys/*` routes run the four guards in `requireSysShellAccess()`.
 */
export default async function SysLayout({ children }: SysLayoutProps) {
  const pathname = headers().get('x-pathname') ?? ''

  if (isSysAuthRoute(pathname)) {
    return <div className="min-h-screen bg-white">{children}</div>
  }

  return <SysShell>{children}</SysShell>
}
