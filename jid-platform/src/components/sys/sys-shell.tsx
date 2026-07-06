import type { ReactNode } from 'react'
import { SysShellChrome } from '@/app/[locale]/(sys)/sys/_components/sys-shell-chrome'
import { getSysShellContext } from '@/lib/sys/shell-context'

type SysShellProps = {
  children: ReactNode
}

/**
 * Section 5.1 / 5.2 — protected /sys layout chrome (light mode only).
 *
 * MANUAL DEVOPS (not code): configure Vercel Firewall Rules to IP allow-list `/sys/*`
 * in production for an additional network-layer gate beyond application guards.
 */
export async function SysShell({ children }: SysShellProps) {
  const context = await getSysShellContext()

  return <SysShellChrome {...context}>{children}</SysShellChrome>
}
