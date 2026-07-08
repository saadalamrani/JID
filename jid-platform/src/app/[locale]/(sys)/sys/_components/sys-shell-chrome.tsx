'use client'

import dynamic from 'next/dynamic'
import { useCallback, useState, type ReactNode } from 'react'
import type { SysShellContext } from '@/lib/sys/shell-context'
import { useSysCommandPaletteHotkey } from './command-palette'
import { SysSidebar } from './sys-sidebar'
import { SysTopbar } from './sys-topbar'

const CommandPalette = dynamic(
  () => import('./command-palette').then((mod) => ({ default: mod.CommandPalette })),
  { ssr: false },
)

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
    <div className="flex min-h-screen bg-background/30">
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
      {paletteOpen ? (
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      ) : null}
    </div>
  )
}
