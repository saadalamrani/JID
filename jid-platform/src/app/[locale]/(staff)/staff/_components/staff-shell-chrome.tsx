'use client'

import { useCallback, useState, type ReactNode } from 'react'
import type { StaffShellContext } from '@/lib/staff/shell-context'
import { StaffIdleGuard } from '@/components/staff/staff-idle-guard'
import {
  StaffCommandPalette,
  useStaffCommandPaletteHotkey,
} from './staff-command-palette'
import { StaffSidebar } from './staff-sidebar'
import { StaffTopbar } from './staff-topbar'

type StaffShellChromeProps = StaffShellContext & {
  children: ReactNode
}

export function StaffShellChrome({
  children,
  profile,
  email,
  sessionIssuedAt,
}: StaffShellChromeProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)

  const togglePalette = useCallback(() => {
    setPaletteOpen((current) => !current)
  }, [])

  useStaffCommandPaletteHotkey(togglePalette)

  return (
    <div className="flex min-h-screen bg-jid-beige/30">
      <StaffIdleGuard />
      <StaffSidebar sessionIssuedAt={sessionIssuedAt} />
      <div className="flex min-w-0 flex-1 flex-col">
        <StaffTopbar
          profile={profile}
          email={email}
          sessionIssuedAt={sessionIssuedAt}
          onOpenCommandPalette={() => setPaletteOpen(true)}
        />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <StaffCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}
