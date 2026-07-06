'use client'

import { useCallback, useState, type ReactNode } from 'react'
import type { SysShellContext } from '@/lib/sys/shell-context'
import { CommandPalette, useSysCommandPaletteHotkey } from './command-palette'
import { SysSidebar } from './sys-sidebar'
import { SysTopbar } from './sys-topbar'

type SysShellChromeProps = SysShellContext & {
  children: ReactNode
}

export function SysShellChrome({
  children,
  profile,
  email,
  sessionIssuedAt,
  maintenanceMode,
  maintenanceMessage,
}: SysShellChromeProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)

  const togglePalette = useCallback(() => {
    setPaletteOpen((current) => !current)
  }, [])

  useSysCommandPaletteHotkey(togglePalette)

  return (
    <div className="flex min-h-screen bg-jid-beige/30">
      <SysSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <SysTopbar
          profile={profile}
          email={email}
          sessionIssuedAt={sessionIssuedAt}
          maintenanceMode={maintenanceMode}
          maintenanceMessage={maintenanceMessage}
          onOpenCommandPalette={() => setPaletteOpen(true)}
        />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}
