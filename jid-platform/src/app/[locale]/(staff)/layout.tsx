import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { StaffShell } from '@/components/staff/staff-shell'
import { isStaffAuthRoute } from '@/lib/staff/routes'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

type StaffLayoutProps = {
  children: ReactNode
}

/**
 * Section 5 — /staff route group.
 *
 * Auth routes (`/staff/login`, `/staff/mfa`) bypass the shell guards.
 * All other `/staff/*` routes run the four guards in `requireStaffShellAccess()`.
 */
export default async function StaffLayout({ children }: StaffLayoutProps) {
  const pathname = headers().get('x-pathname') ?? ''

  if (isStaffAuthRoute(pathname)) {
    return <div className="min-h-screen bg-card">{children}</div>
  }

  return <StaffShell>{children}</StaffShell>
}
