import type { ReactNode } from 'react'
import { StaffShellChrome } from '@/app/[locale]/(staff)/staff/_components/staff-shell-chrome'
import { getStaffShellContext } from '@/lib/staff/shell-context'

type StaffShellProps = {
  children: ReactNode
}

/** Section 5 — protected /staff layout chrome (light mode only). */
export async function StaffShell({ children }: StaffShellProps) {
  const context = await getStaffShellContext()

  return <StaffShellChrome {...context}>{children}</StaffShellChrome>
}
