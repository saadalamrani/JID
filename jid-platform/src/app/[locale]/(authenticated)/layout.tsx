import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'

type AuthenticatedLayoutProps = {
  children: ReactNode
}

/** Minimal shell — auth guard only; top bar comes from locale layout AuthenticatedAppShell. */
export default async function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  await requireAuthenticatedUser()
  return <div className="min-h-screen">{children}</div>
}
